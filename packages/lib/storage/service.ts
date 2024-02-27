import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { PresignedPostOptions, createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { add, isAfter, parseISO } from "date-fns";
import { access, mkdir, readFile, rmdir, unlink, writeFile } from "fs/promises";
import { lookup } from "mime-types";
import { unstable_cache } from "next/cache";
import path, { join } from "path";

import { TAccessType } from "@formbricks/types/storage";

import {
  IS_S3_CONFIGURED,
  MAX_SIZES,
  S3_ACCESS_KEY,
  S3_BUCKET_NAME,
  S3_ENDPOINT_URL,
  S3_REGION,
  S3_SECRET_KEY,
  UPLOADS_DIR,
  WEBAPP_URL,
} from "../constants";
import { generateLocalSignedUrl } from "../crypto";
import { env } from "../env";
import { storageCache } from "./cache";

// S3Client Singleton
let s3ClientInstance: S3Client | null = null;

export const getS3Client = () => {
  if (!s3ClientInstance) {
    const credentials =
      S3_ACCESS_KEY && S3_SECRET_KEY
        ? { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY }
        : undefined;
    s3ClientInstance = new S3Client({
      credentials,
      region: S3_REGION,
      endpoint: S3_ENDPOINT_URL,
    });
  }
  return s3ClientInstance;
};

export const testS3BucketAccess = async () => {
  const s3Client = getS3Client();

  try {
    // Attempt to retrieve metadata about the bucket
    const headBucketCommand = new HeadBucketCommand({
      Bucket: S3_BUCKET_NAME,
    });

    await s3Client.send(headBucketCommand);

    return true;
  } catch (error) {
    console.error("Failed to access S3 bucket:", error);
    throw new Error(`S3 Bucket Access Test Failed: ${error}`);
  }
};

const ensureDirectoryExists = async (dirPath: string) => {
  try {
    await access(dirPath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      await mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
};

type TGetFileResponse = {
  fileBuffer: Buffer;
  metaData: {
    contentType: string;
  };
};

// discriminated union
type TGetSignedUrlResponse =
  | { signedUrl: string; fileUrl: string; presignedFields: Object }
  | {
      signedUrl: string;
      updatedFileName: string;
      fileUrl: string;
      signingData: {
        signature: string;
        timestamp: number;
        uuid: string;
      };
    };

const getS3SignedUrl = async (fileKey: string): Promise<string> => {
  const [_, accessType] = fileKey.split("/");
  const expiresIn = accessType === "public" ? 60 * 60 : 10 * 60;
  const revalidateAfter = accessType === "public" ? expiresIn - 60 * 5 : expiresIn - 60 * 2;

  return unstable_cache(
    async () => {
      const getObjectCommand = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: fileKey,
      });

      try {
        const s3Client = getS3Client();
        return await getSignedUrl(s3Client, getObjectCommand, { expiresIn });
      } catch (err) {
        throw err;
      }
    },
    [`getFileFromS3-${fileKey}`],
    {
      revalidate: revalidateAfter,
      tags: [storageCache.tag.byFileKey(fileKey)],
    }
  )();
};

export const getS3File = async (fileKey: string): Promise<string> => {
  const signedUrl = await getS3SignedUrl(fileKey);
  const signedUrlObject = new URL(signedUrl);

  // The logic below is to check if the signed url has expired.
  // We do this by parsing the X-Amz-Date and Expires query parameters from the signed url
  // and checking if the current time is past the expiration time.
  // If it is, we generate a new signed url and return that instead.
  // We do this because the time-based revalidation for the signed url is not working as expected. (mayve a bug in next.js caching?)

  const amzDate = signedUrlObject.searchParams.get("X-Amz-Date");
  const amzExpires = signedUrlObject.searchParams.get("X-Amz-Expires");

  if (amzDate && amzExpires) {
    const expiresAfterSeconds = parseInt(amzExpires, 10);
    const currentDate = new Date();

    // Get the UTC components
    const yearUTC = currentDate.getUTCFullYear();
    const monthUTC = (currentDate.getUTCMonth() + 1).toString().padStart(2, "0");
    const dayUTC = currentDate.getUTCDate().toString().padStart(2, "0");
    const hoursUTC = currentDate.getUTCHours().toString().padStart(2, "0");
    const minutesUTC = currentDate.getUTCMinutes().toString().padStart(2, "0");
    const secondsUTC = currentDate.getUTCSeconds().toString().padStart(2, "0");

    // Construct the date-time string in UTC format
    const currentDateTimeUTC = `${yearUTC}${monthUTC}${dayUTC}T${hoursUTC}${minutesUTC}${secondsUTC}Z`;

    const amzSigningDate = parseISO(amzDate);
    const amzExpiryDate = add(amzSigningDate, { seconds: expiresAfterSeconds });
    const currentDateISO = parseISO(currentDateTimeUTC);

    const isExpired = isAfter(currentDateISO, amzExpiryDate);

    if (isExpired) {
      // generate a new signed url
      storageCache.revalidate({ fileKey });
      const signedUrlAfterRefetch = await getS3SignedUrl(fileKey);
      return signedUrlAfterRefetch;
    }
  }

  return signedUrl;
};

export const getLocalFile = async (filePath: string): Promise<TGetFileResponse> => {
  try {
    const file = await readFile(filePath);
    let contentType = "";

    try {
      contentType = lookup(filePath) || "";
    } catch (err) {
      throw err;
    }

    return {
      fileBuffer: file,
      metaData: {
        contentType: contentType ?? "",
      },
    };
  } catch (err) {
    throw err;
  }
};

// a single service for generating a signed url based on user's environment variables
export const getUploadSignedUrl = async (
  fileName: string,
  environmentId: string,
  fileType: string,
  accessType: TAccessType,
  plan: "free" | "pro" = "free"
): Promise<TGetSignedUrlResponse> => {
  // add a unique id to the file name

  const fileExtension = fileName.split(".").pop();
  const fileNameWithoutExtension = fileName.split(".").slice(0, -1).join(".");

  if (!fileExtension) {
    throw new Error("File extension not found");
  }

  const updatedFileName = `${fileNameWithoutExtension}--fid--${randomUUID()}.${fileExtension}`;

  // handle the local storage case first
  if (!IS_S3_CONFIGURED) {
    try {
      const { signature, timestamp, uuid } = generateLocalSignedUrl(updatedFileName, environmentId, fileType);

      return {
        signedUrl:
          accessType === "private"
            ? new URL(`${WEBAPP_URL}/api/v1/client/${environmentId}/storage/local`).href
            : new URL(`${WEBAPP_URL}/api/v1/management/storage/local`).href,
        signingData: {
          signature,
          timestamp,
          uuid,
        },
        updatedFileName,
        fileUrl: `/storage/${environmentId}/${accessType}/${updatedFileName}`,
      };
    } catch (err) {
      throw err;
    }
  }

  try {
    const { presignedFields, signedUrl } = await getS3UploadSignedUrl(
      updatedFileName,
      fileType,
      accessType,
      environmentId,
      accessType === "public",
      plan
    );

    return {
      signedUrl,
      presignedFields,
      fileUrl: new URL(`${WEBAPP_URL}/storage/${environmentId}/${accessType}/${updatedFileName}`).href,
    };
  } catch (err) {
    throw err;
  }
};

export const getS3UploadSignedUrl = async (
  fileName: string,
  contentType: string,
  accessType: string,
  environmentId: string,
  isPublic: boolean,
  plan: "free" | "pro" = "free"
) => {
  const maxSize = isPublic ? MAX_SIZES.public : MAX_SIZES[plan];
  const postConditions: PresignedPostOptions["Conditions"] = [["content-length-range", 0, maxSize]];

  try {
    const s3Client = getS3Client();
    const { fields, url } = await createPresignedPost(s3Client, {
      Expires: 10 * 60, // 10 minutes
      Bucket: env.S3_BUCKET_NAME!,
      Key: `${environmentId}/${accessType}/${fileName}`,
      Fields: {
        "Content-Type": contentType,
      },
      Conditions: postConditions,
    });

    return {
      signedUrl: url,
      presignedFields: fields,
    };
  } catch (err) {
    throw err;
  }
};

export const putFileToLocalStorage = async (
  fileName: string,
  fileBuffer: Buffer,
  accessType: string,
  environmentId: string,
  rootDir: string,
  isPublic: boolean = false,
  plan: "free" | "pro" = "free"
) => {
  try {
    await ensureDirectoryExists(`${rootDir}/${environmentId}/${accessType}`);

    const uploadPath = `${rootDir}/${environmentId}/${accessType}/${fileName}`;

    const buffer = Buffer.from(fileBuffer);
    const bufferBytes = buffer.byteLength;

    const maxSize = isPublic ? MAX_SIZES.public : MAX_SIZES[plan];

    if (bufferBytes > maxSize) {
      const err = new Error(`File size exceeds the ${maxSize / (1024 * 1024)} MB limit`);
      err.name = "FileTooLargeError";

      throw err;
    }

    await writeFile(uploadPath, buffer);
  } catch (err) {
    throw err;
  }
};

// a single service to put file in the storage(local or S3), based on the S3 configuration
export const putFile = async (
  fileName: string,
  fileBuffer: Buffer,
  accessType: TAccessType,
  environmentId: string
) => {
  try {
    if (!IS_S3_CONFIGURED) {
      await putFileToLocalStorage(fileName, fileBuffer, accessType, environmentId, UPLOADS_DIR);
      return { success: true, message: "File uploaded" };
    } else {
      const input = {
        Body: fileBuffer,
        Bucket: S3_BUCKET_NAME,
        Key: `${environmentId}/${accessType}/${fileName}`,
      };

      const command = new PutObjectCommand(input);
      const s3Client = getS3Client();
      await s3Client.send(command);
      return { success: true, message: "File uploaded" };
    }
  } catch (err) {
    throw err;
  }
};

export const deleteFile = async (environmentId: string, accessType: TAccessType, fileName: string) => {
  if (!IS_S3_CONFIGURED) {
    try {
      await deleteLocalFile(path.join(UPLOADS_DIR, environmentId, accessType, fileName));
      return { success: true, message: "File deleted" };
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        return { success: false, message: err.message ?? "Something went wrong" };
      }

      return { success: false, message: "File not found", code: 404 };
    }
  }

  try {
    await deleteS3File(`${environmentId}/${accessType}/${fileName}`);
    return { success: true, message: "File deleted" };
  } catch (err: any) {
    if (err.name === "NoSuchKey") {
      return { success: false, message: "File not found", code: 404 };
    } else {
      return { success: false, message: err.message ?? "Something went wrong" };
    }
  }
};

export const deleteLocalFile = async (filePath: string) => {
  try {
    await unlink(filePath);
  } catch (err: any) {
    throw err;
  }
};

export const deleteS3File = async (fileKey: string) => {
  const deleteObjectCommand = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: fileKey,
  });

  try {
    const s3Client = getS3Client();
    await s3Client.send(deleteObjectCommand);
  } catch (err) {
    throw err;
  }
};

export const deleteS3FilesByEnvironmentId = async (environmentId: string) => {
  try {
    // List all objects in the bucket with the prefix of environmentId
    const s3Client = getS3Client();
    const listObjectsOutput = await s3Client.send(
      new ListObjectsCommand({
        Bucket: S3_BUCKET_NAME,
        Prefix: environmentId,
      })
    );

    if (listObjectsOutput.Contents) {
      const objectsToDelete = listObjectsOutput.Contents.map((obj) => {
        return { Key: obj.Key };
      });

      if (!objectsToDelete.length) {
        // no objects to delete
        return null;
      }

      // Delete the objects
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: S3_BUCKET_NAME,
          Delete: {
            Objects: objectsToDelete,
          },
        })
      );
    } else {
      // no objects to delete
      return null;
    }
  } catch (err) {
    throw err;
  }
};

export const deleteLocalFilesByEnvironmentId = async (environmentId: string) => {
  const dirPath = join(UPLOADS_DIR, environmentId);

  try {
    await ensureDirectoryExists(dirPath);
    await rmdir(dirPath, { recursive: true });
  } catch (err) {
    throw err;
  }
};
