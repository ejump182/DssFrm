import "server-only";

import { prisma } from "@formbricks/database";
import { ZOptionalNumber, ZString } from "@formbricks/types/common";
import { ZId } from "@formbricks/types/environment";
import { DatabaseError, ResourceNotFoundError } from "@formbricks/types/errors";
import {
  TIntegration,
  TIntegrationInput,
  ZIntegration,
  ZIntegrationType,
} from "@formbricks/types/integration";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { ITEMS_PER_PAGE, SERVICES_REVALIDATION_INTERVAL } from "../constants";
import { formatDateFields } from "../utils/datetime";
import { validateInputs } from "../utils/validate";
import { integrationCache } from "./cache";

export async function createOrUpdateIntegration(
  environmentId: string,
  integrationData: TIntegrationInput
): Promise<TIntegration> {
  validateInputs([environmentId, ZId]);

  try {
    const integration = await prisma.integration.upsert({
      where: {
        type_environmentId: {
          environmentId,
          type: integrationData.type,
        },
      },
      update: {
        ...integrationData,
        environment: { connect: { id: environmentId } },
      },
      create: {
        ...integrationData,
        environment: { connect: { id: environmentId } },
      },
    });

    integrationCache.revalidate({
      environmentId,
    });
    return integration;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(error);
      throw new DatabaseError(error.message);
    }
    throw error;
  }
}

export const getIntegrations = async (environmentId: string, page?: number): Promise<TIntegration[]> =>
  unstable_cache(
    async () => {
      validateInputs([environmentId, ZId], [page, ZOptionalNumber]);

      try {
        const integrations = await prisma.integration.findMany({
          where: {
            environmentId,
          },
          take: page ? ITEMS_PER_PAGE : undefined,
          skip: page ? ITEMS_PER_PAGE * (page - 1) : undefined,
        });
        if (!integrations) {
          throw new ResourceNotFoundError("Integrations by EnvironmentId", environmentId);
        }
        return integrations.map((integration) => formatDateFields(integration, ZIntegration));
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }
        throw error;
      }
    },
    [`getIntegrations-${environmentId}-${page}`],
    {
      tags: [integrationCache.tag.byEnvironmentId(environmentId)],
      revalidate: SERVICES_REVALIDATION_INTERVAL,
    }
  )();

export const getIntegration = async (integrationId: string): Promise<TIntegration | null> =>
  unstable_cache(
    async () => {
      try {
        const integration = await prisma.integration.findUnique({
          where: {
            id: integrationId,
          },
        });
        if (!integration) {
          throw new ResourceNotFoundError("Integrations", integrationId);
        }
        return formatDateFields(integration, ZIntegration);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }
        throw error;
      }
    },
    [`getIntegration-${integrationId}`],
    { tags: [integrationCache.tag.byId(integrationId)], revalidate: SERVICES_REVALIDATION_INTERVAL }
  )();

export const getIntegrationByType = async (
  environmentId: string,
  type: TIntegrationInput["type"]
): Promise<TIntegration | null> =>
  unstable_cache(
    async () => {
      validateInputs([environmentId, ZId], [type, ZIntegrationType]);

      try {
        const integration = await prisma.integration.findUnique({
          where: {
            type_environmentId: {
              environmentId,
              type,
            },
          },
        });
        if (!integration) {
          throw new ResourceNotFoundError("Integration by type", type);
        }
        return formatDateFields(integration, ZIntegration);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }
        throw error;
      }
    },
    [`getIntegrationByType-${environmentId}-${type}`],
    {
      tags: [integrationCache.tag.byEnvironmentIdAndType(environmentId, type)],
      revalidate: SERVICES_REVALIDATION_INTERVAL,
    }
  )();

export const deleteIntegration = async (integrationId: string): Promise<TIntegration> => {
  validateInputs([integrationId, ZString]);

  try {
    const integrationData = await prisma.integration.delete({
      where: {
        id: integrationId,
      },
    });

    integrationCache.revalidate({
      id: integrationData.id,
      environmentId: integrationData.environmentId,
      type: integrationData.type,
    });

    return integrationData;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};
