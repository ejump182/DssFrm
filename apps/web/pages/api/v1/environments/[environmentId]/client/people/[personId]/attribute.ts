import { prisma } from "@formbricks/database";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const environmentId = req.query.environmentId?.toString();

  if (!environmentId) {
    return res.status(400).json({ message: "Missing environmentId" });
  }

  const personId = req.query.personId?.toString();

  if (!personId) {
    return res.status(400).json({ message: "Missing personId" });
  }

  // CORS
  if (req.method === "OPTIONS") {
    res.status(200).end();
  }
  // POST
  else if (req.method === "POST") {
    const { key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ message: "Missing key or value" });
    }
    const currentPerson = await prisma.person.findUnique({
      where: {
        id: personId,
      },
      select: {
        id: true,
        attributes: true,
      },
    });

    if (!currentPerson) {
      return res.status(400).json({ message: "Person not found" });
    }

    const currentAttributes = currentPerson.attributes
      ? JSON.parse(JSON.stringify(currentPerson.attributes))
      : {};

    // update person
    const updatedPerson = await prisma.person.update({
      where: {
        id: personId,
      },
      data: {
        attributes: { ...currentAttributes, [key]: value },
      },
      select: {
        id: true,
        userId: true,
        email: true,
        attributes: true,
      },
    });

    return res.json(updatedPerson);
  }

  // Unknown HTTP Method
  else {
    throw new Error(`The HTTP ${req.method} method is not supported by this route.`);
  }
}
