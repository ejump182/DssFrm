import "server-only";

import { prisma } from "@formbricks/database";
import { TActionClassType } from "@formbricks/types/v1/actionClasses";
import { TAction, TActionInput, ZActionInput } from "@formbricks/types/v1/actions";
import { ZOptionalNumber } from "@formbricks/types/v1/common";
import { ZId } from "@formbricks/types/v1/environment";
import { DatabaseError, ResourceNotFoundError } from "@formbricks/types/v1/errors";
import { Prisma } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";
import { actionClassCache } from "../actionClass/cache";
import { ITEMS_PER_PAGE, SERVICES_REVALIDATION_INTERVAL } from "../constants";
import { getSessionCached } from "../session/service";
import { createActionClass, getActionClassByEnvironmentIdAndName } from "../actionClass/service";
import { validateInputs } from "../utils/validate";
import { actionCache } from "./cache";

export const getActionsByEnvironmentId = async (
  environmentId: string,
  limit?: number,
  page?: number
): Promise<TAction[]> => {
  const actions = await unstable_cache(
    async () => {
      validateInputs([environmentId, ZId], [limit, ZOptionalNumber], [page, ZOptionalNumber]);

      try {
        const actionsPrisma = await prisma.event.findMany({
          where: {
            eventClass: {
              environmentId: environmentId,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: page ? ITEMS_PER_PAGE : undefined,
          skip: page ? ITEMS_PER_PAGE * (page - 1) : undefined,
          include: {
            eventClass: true,
          },
        });
        const actions: TAction[] = [];
        // transforming response to type TAction[]
        actionsPrisma.forEach((action) => {
          actions.push({
            id: action.id,
            createdAt: action.createdAt,
            sessionId: action.sessionId,
            properties: action.properties,
            actionClass: action.eventClass,
          });
        });
        return actions;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError("Database operation failed");
        }

        throw error;
      }
    },
    [`getActionsByEnvironmentId-${environmentId}-${page}`],
    {
      tags: [actionCache.tag.byEnvironmentId(environmentId)],
      revalidate: SERVICES_REVALIDATION_INTERVAL,
    }
  )();

  // since the unstable_cache function does not support deserialization of dates, we need to manually deserialize them
  // https://github.com/vercel/next.js/issues/51613
  return actions.map((action) => ({
    ...action,
    createdAt: new Date(action.createdAt),
  }));
};

export const createAction = async (data: TActionInput): Promise<TAction> => {
  validateInputs([data, ZActionInput]);

  const { environmentId, name, properties, sessionId } = data;

  let eventType: TActionClassType = "code";
  if (name === "Exit Intent (Desktop)" || name === "50% Scroll") {
    eventType = "automatic";
  }

  const session = await getSessionCached(sessionId);

  if (!session) {
    throw new ResourceNotFoundError("Session", sessionId);
  }

  let actionClass = await getActionClassByEnvironmentIdAndName(environmentId, name);

  if (!actionClass) {
    actionClass = await createActionClass(environmentId, {
      name,
      type: eventType,
      environmentId,
    });
  }

  const action = await prisma.event.create({
    data: {
      properties,
      session: {
        connect: {
          id: sessionId,
        },
      },
      eventClass: {
        connect: {
          id: actionClass.id,
        },
      },
    },
  });

  revalidateTag(sessionId);
  actionCache.revalidate({
    environmentId,
  });

  return {
    id: action.id,
    createdAt: action.createdAt,
    sessionId: action.sessionId,
    properties: action.properties,
    actionClass,
  };
};

export const getActionCountInLastHour = async (actionClassId: string): Promise<number> =>
  unstable_cache(
    async () => {
      validateInputs([actionClassId, ZId]);

      try {
        const numEventsLastHour = await prisma.event.count({
          where: {
            eventClassId: actionClassId,
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000),
            },
          },
        });
        return numEventsLastHour;
      } catch (error) {
        throw error;
      }
    },
    [`getActionCountInLastHour-${actionClassId}`],
    {
      tags: [actionClassCache.tag.byId(actionClassId)],
      revalidate: SERVICES_REVALIDATION_INTERVAL,
    }
  )();

export const getActionCountInLast24Hours = async (actionClassId: string): Promise<number> =>
  unstable_cache(
    async () => {
      validateInputs([actionClassId, ZId]);

      try {
        const numEventsLast24Hours = await prisma.event.count({
          where: {
            eventClassId: actionClassId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });
        return numEventsLast24Hours;
      } catch (error) {
        throw error;
      }
    },
    [`getActionCountInLast24Hours-${actionClassId}`],
    {
      tags: [actionClassCache.tag.byId(actionClassId)],
      revalidate: SERVICES_REVALIDATION_INTERVAL,
    }
  )();

export const getActionCountInLast7Days = async (actionClassId: string): Promise<number> =>
  unstable_cache(
    async () => {
      validateInputs([actionClassId, ZId]);

      try {
        const numEventsLast7Days = await prisma.event.count({
          where: {
            eventClassId: actionClassId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        });
        return numEventsLast7Days;
      } catch (error) {
        throw error;
      }
    },
    [`getActionCountInLast7Days-${actionClassId}`],
    {
      tags: [actionClassCache.tag.byId(actionClassId)],
      revalidate: SERVICES_REVALIDATION_INTERVAL,
    }
  )();
