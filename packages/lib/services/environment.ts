import "server-only";
import { prisma } from "@formbricks/database";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { DatabaseError, ResourceNotFoundError, ValidationError } from "@formbricks/errors";
import { ZEnvironment } from "@formbricks/types/v1/environment";
import type { TEnvironment } from "@formbricks/types/v1/environment";
import { cache } from "react";

export const getEnvironment = cache(async (environmentId: string): Promise<TEnvironment | null> => {
  let environmentPrisma;
  try {
    environmentPrisma = await prisma.environment.findUnique({
      where: {
        id: environmentId,
      },
    });

    if (!environmentPrisma) {
      throw new ResourceNotFoundError("Environment", environmentId);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError("Database operation failed");
    }

    throw error;
  }

  try {
    const environment = ZEnvironment.parse(environmentPrisma);
    return environment;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
    throw new ValidationError("Data validation of environment failed");
  }
});
