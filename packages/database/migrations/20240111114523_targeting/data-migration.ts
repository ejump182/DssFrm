import { createId } from "@paralleldrive/cuid2";
import { PrismaClient } from "@prisma/client";

import { TBaseFilter, TBaseFilters } from "@formbricks/types/userSegment";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const allSurveysWithAttributeFilters = await prisma.survey.findMany({
      where: {
        attributeFilters: {
          some: {},
        },
      },
      include: {
        attributeFilters: { include: { attributeClass: true } },
      },
    });

    allSurveysWithAttributeFilters.forEach(async (survey) => {
      const { attributeFilters } = survey;
      // from these attribute filters, we need to create user segments
      // each attribute filter will be a filter in the user segment
      // all the filters will be joined by AND
      // the user segment will be private

      const filters: TBaseFilters = attributeFilters.map((filter, idx) => {
        const { attributeClass } = filter;
        const attributeSegment: TBaseFilter = {
          id: filter.id,
          connector: idx === 0 ? null : "and",
          resource: {
            id: createId(),
            root: {
              type: "attribute",
              attributeClassName: attributeClass.name,
            },
            qualifier: {
              operator: filter.condition,
            },
            value: filter.value,
            meta: {
              isUserId: attributeClass.name === "userId" && attributeClass.type === "automatic",
            },
          },
        };

        return attributeSegment;
      });

      await tx.userSegment.create({
        data: {
          title: "",
          description: "",
          isPrivate: true,
          filters,
          surveys: {
            connect: {
              id: survey.id,
            },
          },
          environment: {
            connect: {
              id: survey.environmentId,
            },
          },
        },
      });
    });

    // delete all attribute filters
    await tx.surveyAttributeFilter.deleteMany({});
  });
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
