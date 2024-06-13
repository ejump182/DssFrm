import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@formbricks/database";
import { ZOptionalNumber, ZString } from "@formbricks/types/common";
import { ZId } from "@formbricks/types/environment";
import { DatabaseError, ResourceNotFoundError } from "@formbricks/types/errors";
import {
  TOrganization,
  TOrganizationBilling,
  TOrganizationCreateInput,
  TOrganizationUpdateInput,
  ZOrganizationCreateInput,
} from "@formbricks/types/organizations";
import { TUserNotificationSettings } from "@formbricks/types/user";
import { cache } from "../cache";
import { IS_FORMBRICKS_CLOUD, ITEMS_PER_PAGE } from "../constants";
import { BILLING_LIMITS } from "../constants";
import { environmentCache } from "../environment/cache";
import { getProducts } from "../product/service";
import { getUsersWithOrganization, updateUser } from "../user/service";
import { validateInputs } from "../utils/validate";
import { organizationCache } from "./cache";

export const select = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  billing: true,
};

export const getOrganizationsTag = (organizationId: string) => `organizations-${organizationId}`;
export const getOrganizationsByUserIdCacheTag = (userId: string) => `users-${userId}-organizations`;
export const getOrganizationByEnvironmentIdCacheTag = (environmentId: string) =>
  `environments-${environmentId}-organization`;

export const getOrganizationsByUserId = (userId: string, page?: number): Promise<TOrganization[]> =>
  cache(
    async () => {
      validateInputs([userId, ZString], [page, ZOptionalNumber]);

      try {
        const organizations = await prisma.organization.findMany({
          where: {
            memberships: {
              some: {
                userId,
              },
            },
          },
          select,
          take: page ? ITEMS_PER_PAGE : undefined,
          skip: page ? ITEMS_PER_PAGE * (page - 1) : undefined,
        });
        if (!organizations) {
          throw new ResourceNotFoundError("Organizations by UserId", userId);
        }
        return organizations;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getOrganizationsByUserId-${userId}-${page}`],
    {
      tags: [organizationCache.tag.byUserId(userId)],
    }
  )();

export const getOrganizationByEnvironmentId = (environmentId: string): Promise<TOrganization | null> =>
  cache(
    async () => {
      validateInputs([environmentId, ZId]);

      try {
        const organization = await prisma.organization.findFirst({
          where: {
            products: {
              some: {
                environments: {
                  some: {
                    id: environmentId,
                  },
                },
              },
            },
          },
          select: { ...select, memberships: true }, // include memberships
        });

        return organization;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          console.error(error);
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getOrganizationByEnvironmentId-${environmentId}`],
    {
      tags: [organizationCache.tag.byEnvironmentId(environmentId)],
    }
  )();

export const getOrganization = (organizationId: string): Promise<TOrganization | null> =>
  cache(
    async () => {
      validateInputs([organizationId, ZString]);

      try {
        const organization = await prisma.organization.findUnique({
          where: {
            id: organizationId,
          },
          select,
        });
        return organization;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getOrganization-${organizationId}`],
    {
      tags: [organizationCache.tag.byId(organizationId)],
    }
  )();

export const createOrganization = async (
  organizationInput: TOrganizationCreateInput
): Promise<TOrganization> => {
  try {
    validateInputs([organizationInput, ZOrganizationCreateInput]);
    let organizationInputWithBilling = {
      ...organizationInput,
    };

    if (IS_FORMBRICKS_CLOUD) {
      organizationInputWithBilling = {
        ...organizationInput,
        billing: {
          plan: "free",
          limits: {
            monthly: {
              responses: BILLING_LIMITS.FREE.RESPONSES,
              miu: BILLING_LIMITS.FREE.MIU,
            },
          },
          stripeCustomerId: null,
        },
      };
    }

    const organization = await prisma.organization.create({
      data: {
        ...organizationInputWithBilling,
      },
      select,
    });

    organizationCache.revalidate({
      id: organization.id,
      count: true,
    });

    return organization;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

export const updateOrganization = async (
  organizationId: string,
  data: Partial<TOrganizationUpdateInput>
): Promise<TOrganization> => {
  try {
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data,
      select: { ...select, memberships: true, products: { select: { environments: true } } }, // include memberships & environments
    });

    // revalidate cache for members
    updatedOrganization?.memberships.forEach((membership) => {
      organizationCache.revalidate({
        userId: membership.userId,
      });
    });

    // revalidate cache for environments
    updatedOrganization?.products.forEach((product) => {
      product.environments.forEach(async (environment) => {
        organizationCache.revalidate({
          environmentId: environment.id,
        });
      });
    });

    const organization = {
      ...updatedOrganization,
      memberships: undefined,
      products: undefined,
    };

    organizationCache.revalidate({
      id: organization.id,
    });

    return organization;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2016") {
      throw new ResourceNotFoundError("Organization", organizationId);
    }
    throw error; // Re-throw any other errors
  }
};

export const deleteOrganization = async (organizationId: string): Promise<TOrganization> => {
  validateInputs([organizationId, ZId]);
  try {
    const deletedOrganization = await prisma.organization.delete({
      where: {
        id: organizationId,
      },
      select: { ...select, memberships: true, products: { select: { environments: true } } }, // include memberships & environments
    });

    // revalidate cache for members
    deletedOrganization?.memberships.forEach((membership) => {
      organizationCache.revalidate({
        userId: membership.userId,
      });
    });

    // revalidate cache for environments
    deletedOrganization?.products.forEach((product) => {
      product.environments.forEach((environment) => {
        environmentCache.revalidate({
          id: environment.id,
        });

        organizationCache.revalidate({
          environmentId: environment.id,
        });
      });
    });

    const organization = {
      ...deletedOrganization,
      memberships: undefined,
      products: undefined,
    };

    organizationCache.revalidate({
      id: organization.id,
      count: true,
    });

    return organization;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

export const getOrganizationsWithPaidPlan = (): Promise<TOrganization[]> =>
  cache(
    async () => {
      try {
        const fetchedOrganizations = await prisma.organization.findMany({
          where: {
            OR: [
              {
                billing: {
                  path: ["features", "inAppSurvey", "status"],
                  not: "inactive",
                },
              },
              {
                billing: {
                  path: ["features", "userTargeting", "status"],
                  not: "inactive",
                },
              },
            ],
          },
          select,
        });

        return fetchedOrganizations;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }
        throw error;
      }
    },
    ["getOrganizationsWithPaidPlan"],
    {
      tags: [],
    }
  )();

export const getMonthlyActiveOrganizationPeopleCount = (organizationId: string): Promise<number> =>
  cache(
    async () => {
      validateInputs([organizationId, ZId]);

      try {
        // Define the start of the month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all environment IDs for the organization
        const products = await getProducts(organizationId);
        const environmentIds = products.flatMap((product) => product.environments.map((env) => env.id));

        // Aggregate the count of active people across all environments
        const peopleAggregations = await prisma.person.aggregate({
          _count: {
            id: true,
          },
          where: {
            AND: [
              { environmentId: { in: environmentIds } },
              {
                OR: [
                  {
                    actions: {
                      some: {
                        createdAt: { gte: firstDayOfMonth },
                      },
                    },
                  },
                  {
                    responses: {
                      some: {
                        createdAt: { gte: firstDayOfMonth },
                      },
                    },
                  },
                ],
              },
            ],
          },
        });

        return peopleAggregations._count.id;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getMonthlyActiveOrganizationPeopleCount-${organizationId}`],
    {
      revalidate: 60 * 60 * 2, // 2 hours
    }
  )();

export const getMonthlyOrganizationResponseCount = (organizationId: string): Promise<number> =>
  cache(
    async () => {
      validateInputs([organizationId, ZId]);

      try {
        // Define the start of the month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all environment IDs for the organization
        const products = await getProducts(organizationId);
        const environmentIds = products.flatMap((product) => product.environments.map((env) => env.id));

        // Use Prisma's aggregate to count responses for all environments
        const responseAggregations = await prisma.response.aggregate({
          _count: {
            id: true,
          },
          where: {
            AND: [
              { survey: { environmentId: { in: environmentIds } } },
              { createdAt: { gte: firstDayOfMonth } },
            ],
          },
        });

        // The result is an aggregation of the total count
        return responseAggregations._count.id;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getMonthlyOrganizationResponseCount-${organizationId}`],
    {
      revalidate: 60 * 60 * 2, // 2 hours
    }
  )();

export const getOrganizationBillingInfo = (organizationId: string): Promise<TOrganizationBilling | null> =>
  cache(
    async () => {
      validateInputs([organizationId, ZId]);

      try {
        const billingInfo = await prisma.organization.findUnique({
          where: {
            id: organizationId,
          },
        });

        return billingInfo?.billing ?? null;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new DatabaseError(error.message);
        }

        throw error;
      }
    },
    [`getOrganizationBillingInfo-${organizationId}`],
    {
      tags: [organizationCache.tag.byId(organizationId)],
    }
  )();

export const subscribeOrganizationMembersToSurveyResponses = async (
  environmentId: string,
  surveyId: string
): Promise<void> => {
  try {
    const organization = await getOrganizationByEnvironmentId(environmentId);
    if (!organization) {
      throw new ResourceNotFoundError("Organization", environmentId);
    }

    const users = await getUsersWithOrganization(organization.id);
    await Promise.all(
      users.map((user) => {
        if (!user.notificationSettings?.unsubscribedOrganizationIds?.includes(organization?.id as string)) {
          const defaultSettings = { alert: {}, weeklySummary: {} };
          const updatedNotificationSettings: TUserNotificationSettings = {
            ...defaultSettings,
            ...user.notificationSettings,
          };

          updatedNotificationSettings.alert[surveyId] = true;

          return updateUser(user.id, {
            notificationSettings: updatedNotificationSettings,
          });
        }

        return Promise.resolve();
      })
    );
  } catch (error) {
    throw error;
  }
};
