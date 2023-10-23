import { getUpdatedState } from "@/app/api/v1/js/sync/lib/sync";
import { responses } from "@/app/lib/api/response";
import { transformErrorToDetails } from "@/app/lib/api/validator";
import { prisma } from "@formbricks/database";
import { personCache } from "@formbricks/lib/person/cache";
import { deletePerson, selectPerson, transformPrismaPerson } from "@formbricks/lib/person/service";
import { ZJsPeopleUserIdInput } from "@formbricks/types/js";
import { NextResponse } from "next/server";

export async function OPTIONS(): Promise<NextResponse> {
  return responses.successResponse({}, true);
}

export async function POST(req: Request, { params }): Promise<NextResponse> {
  try {
    const { personId } = params;
    const jsonInput = await req.json();

    // validate using zod
    const inputValidation = ZJsPeopleUserIdInput.safeParse(jsonInput);

    if (!inputValidation.success) {
      return responses.badRequestResponse(
        "Fields are missing or incorrectly formatted",
        transformErrorToDetails(inputValidation.error),
        true
      );
    }

    const { environmentId, userId, sessionId } = inputValidation.data;

    let returnedPerson;
    // check if person with this userId exists
    const person = await prisma.person.findFirst({
      where: {
        environmentId,
        attributes: {
          some: {
            attributeClass: {
              name: "userId",
            },
            value: userId,
          },
        },
      },
      select: selectPerson,
    });
    // if person exists, reconnect session and delete old user
    if (person) {
      // reconnect session to new person
      await prisma.session.update({
        where: {
          id: sessionId,
        },
        data: {
          person: {
            connect: {
              id: person.id,
            },
          },
        },
      });

      // delete old person
      await deletePerson(personId);

      returnedPerson = person;
    } else {
      // update person with userId
      returnedPerson = await prisma.person.update({
        where: {
          id: personId,
        },
        data: {
          attributes: {
            create: {
              value: userId,
              attributeClass: {
                connect: {
                  name_environmentId: {
                    name: "userId",
                    environmentId,
                  },
                },
              },
            },
          },
        },
        select: selectPerson,
      });
    }

    const transformedPerson = transformPrismaPerson(returnedPerson);

    const state = await getUpdatedState(environmentId, transformedPerson.id, sessionId);

    personCache.revalidate({
      id: transformedPerson.id,
      environmentId: environmentId,
    });

    return responses.successResponse({ ...state }, true);
  } catch (error) {
    console.error(error);
    return responses.internalServerErrorResponse(
      "Unable to complete response. See server logs for details.",
      true
    );
  }
}
