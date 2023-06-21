
import { hasEnvironmentAccess, getSessionUser } from "@/lib/api/apiHelper";
import { prisma } from "@formbricks/database/src/client";
import { TTag } from "@formbricks/types/v1/tags";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const environmentId = req.query.environmentId?.toString();
  const productId = req.query.productId?.toString();

  // Check Authentication
  const currentUser = await getSessionUser(req, res);
  if (!currentUser) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Check environmentId
  if (!environmentId) {
    return res.status(400).json({ message: "Invalid environmentId" });
  }

  // Check productId
  if (!productId) {
    return res.status(400).json({ message: "Invalid productId" });
  }

  // Check whether user has access to the environment
  const hasAccess = await hasEnvironmentAccess(req, res, environmentId);

  if (!hasAccess) {
    return res.status(403).json({ message: "You are not authorized to access this environment! " });
  }
  
  // POST /api/environments/[environmentId]/product/[productId]/tags/merge

  // Merge tags together

  if (req.method === "PATCH") {
    const {
      originalTagId,
      newTagId
    } = req.body

    if (!originalTagId) {
      return res.status(400).json({ message: "Invalid Tag Id" });
    }

    if (!newTagId) {
      return res.status(400).json({ message: "Invalid Tag Id" });
    }

    let originalTag: TTag | null;

    originalTag = await prisma.tag.findUnique({
      where: {
        id: originalTagId
      }
    })
    
    if (!originalTag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    let newTag: TTag | null;

    newTag = await prisma.tag.findUnique({
      where: {
        id: newTagId
      }
    })
    
    if (!newTag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    try {
     await prisma.$transaction([
       prisma.tagsOnResponses.updateMany({
        where: {
          tagId: originalTagId
        }, 
        data: {
          tagId: newTagId
        }
      }),
      
      prisma.tag.delete({
        where: {
          id: originalTagId
        }
      })
     ])
    } catch (e) {
      console.log({error: e})
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json({
      success: true,
      message: "Tag merged successfully"
    });
  }

  // Unknown HTTP Method
  else {
    throw new Error(`The HTTP ${req.method} method is not supported by this route.`);
  }
}
