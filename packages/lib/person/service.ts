import "server-only";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@formbricks/database";
import { ZOptionalNumber, ZString } from "@formbricks/types/common";
import { ZId } from "@formbricks/types/environment";
import { DatabaseError } from "@formbricks/types/errors";
import { TPerson, ZPerson } from "@formbricks/types/people";

import { ITEMS_PER_PAGE } from "../constants";
import { formatDateFields } from "../utils/datetime";
import { validateInputs } from "../utils/validate";
import { activePersonCache, personCache } from "./cache";

export const selectPerson = {
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  environmentId: true,
};

type TransformPersonInput = {
  id: string;
  userId: string;
  environmentId: string;
  attributes: {
    value: string;
    attributeClass: {
      name: string;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
};

export const transformPrismaPerson = (person: TransformPersonInput): TPerson => {
  const attributes = person.attributes.reduce(
    (acc, attr) => {
      acc[attr.attributeClass.name] = attr.value;
      return acc;
    },
    {} as Record<string, string | number>
  );

  return {
    id: person.id,
    userId: person.userId,
    attributes: attributes,
    environmentId: person.environmentId,
    createdAt: new Date(person.createdAt),
    updatedAt: new Date(person.updatedAt),
  } as TPerson;
};

export const getPerson = async (personId: string): Promise<TPerson | null> => {
  const prismaPerson = await unstable_cache(
    async () => {
      validateInputs([personId, ZId]);

      try {
        return await prisma.person.findUnique({
          where: {
            id: personId,
          },
          select: selectPerson,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getPerson-${personId}`],
    {
      tags: [personCache.tag.byId(personId)],
    }
  )();

  return prismaPerson ? formatDateFields(prismaPerson, ZPerson) : null;
};

export const getPeople = async (environmentId: string, page?: number): Promise<TPerson[]> => {
  const peoplePrisma = await unstable_cache(
    async () => {
      validateInputs([environmentId, ZId], [page, ZOptionalNumber]);

      try {
        return await prisma.person.findMany({
          where: {
            environmentId: environmentId,
          },
          select: selectPerson,
          take: page ? ITEMS_PER_PAGE : undefined,
          skip: page ? ITEMS_PER_PAGE * (page - 1) : undefined,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getPeople-${environmentId}-${page}`],
    {
      tags: [personCache.tag.byEnvironmentId(environmentId)],
    }
  )();

  return peoplePrisma
    .map((prismaPerson) => formatDateFields(prismaPerson, ZPerson))
    .filter((person: TPerson | null): person is TPerson => person !== null);
};

export const getPeopleCount = async (environmentId: string): Promise<number> =>
  unstable_cache(
    async () => {
      validateInputs([environmentId, ZId]);

      try {
        return await prisma.person.count({
          where: {
            environmentId: environmentId,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getPeopleCount-${environmentId}`],
    {
      tags: [personCache.tag.byEnvironmentId(environmentId)],
    }
  )();

export const createPerson = async (environmentId: string, userId: string): Promise<TPerson> => {
  validateInputs([environmentId, ZId]);

  try {
    const person = await prisma.person.create({
      data: {
        environment: {
          connect: {
            id: environmentId,
          },
        },
        userId,
      },
      select: selectPerson,
    });

    personCache.revalidate({
      id: person.id,
      environmentId,
      userId,
    });

    return person;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // If the person already exists, return it
      if (error.code === "P2002") {
        // HOTFIX to handle formbricks-js failing because of caching issue
        // Handle the case where the person record already exists
        const existingPerson = await prisma.person.findFirst({
          where: {
            environmentId,
            userId,
          },
          select: selectPerson,
        });

        if (existingPerson) {
          return existingPerson;
        }
      }
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

export const deletePerson = async (personId: string): Promise<TPerson | null> => {
  validateInputs([personId, ZId]);

  try {
    const person = await prisma.person.delete({
      where: {
        id: personId,
      },
      select: selectPerson,
    });

    personCache.revalidate({
      id: person.id,
      userId: person.userId,
      environmentId: person.environmentId,
    });

    return person;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

export const getPersonByUserId = async (environmentId: string, userId: string): Promise<TPerson | null> => {
  const person = await unstable_cache(
    async () => {
      validateInputs([environmentId, ZId], [userId, ZString]);

      // check if userId exists as a column
      const personWithUserId = await prisma.person.findFirst({
        where: {
          environmentId,
          userId,
        },
        select: selectPerson,
      });

      if (personWithUserId) {
        return personWithUserId;
      }

      return null;
    },
    [`getPersonByUserId-${environmentId}-${userId}`],
    {
      tags: [personCache.tag.byEnvironmentIdAndUserId(environmentId, userId)],
    }
  )();
  return person ? formatDateFields(person, ZPerson) : null;
};

export const getIsPersonMonthlyActive = async (personId: string): Promise<boolean> =>
  unstable_cache(
    async () => {
      try {
        const latestAction = await prisma.action.findFirst({
          where: {
            personId,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            createdAt: true,
          },
        });
        if (!latestAction || new Date(latestAction.createdAt).getMonth() !== new Date().getMonth()) {
          return false;
        }
        return true;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getIsPersonMonthlyActive-${personId}`],
    {
      tags: [activePersonCache.tag.byId(personId)],
      revalidate: 60 * 60 * 24, // 24 hours
    }
  )();
