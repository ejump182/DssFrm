import { writeData as airtableWriteData } from "@formbricks/lib/airtable/service";
import { writeData } from "@formbricks/lib/googleSheet/service";
import { getLocalizedValue } from "@formbricks/lib/i18n/utils";
import { writeData as writeNotionData } from "@formbricks/lib/notion/service";
import { processResponseData } from "@formbricks/lib/responses";
import { writeDataToSlack } from "@formbricks/lib/slack/service";
import { TIntegration } from "@formbricks/types/integration";
import { TIntegrationAirtable } from "@formbricks/types/integration/airtable";
import { TIntegrationGoogleSheets } from "@formbricks/types/integration/googleSheet";
import { TIntegrationNotion, TIntegrationNotionConfigData } from "@formbricks/types/integration/notion";
import { TIntegrationSlack } from "@formbricks/types/integration/slack";
import { TPipelineInput } from "@formbricks/types/pipelines";
import { TResponseMeta } from "@formbricks/types/responses";
import { TSurvey, TSurveyQuestionTypeEnum } from "@formbricks/types/surveys";

const convertMetaObjectToString = (metadata: TResponseMeta) => {
  let result: string[] = [];
  if (metadata.source) result.push(`Source: ${metadata.source}`);
  if (metadata.url) result.push(`URL: ${metadata.url}`);
  if (metadata.userAgent?.browser) result.push(`Browser: ${metadata.userAgent.browser}`);
  if (metadata.userAgent?.os) result.push(`OS: ${metadata.userAgent.os}`);
  if (metadata.userAgent?.device) result.push(`Device: ${metadata.userAgent.device}`);
  if (metadata.country) result.push(`Country: ${metadata.country}`);
  if (metadata.action) result.push(`Action: ${metadata.action}`);

  // Join all the elements in the result array with a newline for formatting
  return result.join("\n");
};

export const handleIntegrations = async (
  integrations: TIntegration[],
  data: TPipelineInput,
  survey: TSurvey
) => {
  for (const integration of integrations) {
    switch (integration.type) {
      case "googleSheets":
        await handleGoogleSheetsIntegration(integration as TIntegrationGoogleSheets, data, survey);
        break;
      case "slack":
        await handleSlackIntegration(integration as TIntegrationSlack, data, survey);
        break;
      case "airtable":
        await handleAirtableIntegration(integration as TIntegrationAirtable, data, survey);
        break;
      case "notion":
        await handleNotionIntegration(integration as TIntegrationNotion, data, survey);
        break;
    }
  }
};

const handleAirtableIntegration = async (
  integration: TIntegrationAirtable,
  data: TPipelineInput,
  survey: TSurvey
) => {
  if (integration.config.data.length > 0) {
    for (const element of integration.config.data) {
      if (element.surveyId === data.surveyId) {
        const values = await extractResponses(data, element.questionIds as string[], survey);

        await airtableWriteData(integration.config.key, element, values);
      }
    }
  }
};

const handleGoogleSheetsIntegration = async (
  integration: TIntegrationGoogleSheets,
  data: TPipelineInput,
  survey: TSurvey
) => {
  if (integration.config.data.length > 0) {
    for (const element of integration.config.data) {
      if (element.surveyId === data.surveyId) {
        const ids =
          element.includesHiddenFields && survey.hiddenFields.fieldIds
            ? [...element.questionIds, ...survey.hiddenFields.fieldIds]
            : element.questionIds;
        const values = await extractResponses(data, ids, survey);
        if (element.includesMetadata) {
          values[0].push(convertMetaObjectToString(data.response.meta));
          values[1].push("Metadata");
        }
        const integrationData = structuredClone(integration);
        integrationData.config.data.forEach((data) => {
          data.createdAt = new Date(data.createdAt);
        });
        await writeData(integrationData, element.spreadsheetId, values);
      }
    }
  }
};

const handleSlackIntegration = async (
  integration: TIntegrationSlack,
  data: TPipelineInput,
  survey: TSurvey
) => {
  if (integration.config.data.length > 0) {
    for (const element of integration.config.data) {
      if (element.surveyId === data.surveyId) {
        const values = await extractResponses(data, element.questionIds as string[], survey);
        await writeDataToSlack(integration.config.key, element.channelId, values, survey?.name);
      }
    }
  }
};

const extractResponses = async (
  pipelineData: TPipelineInput,
  questionIds: string[],
  survey: TSurvey
): Promise<string[][]> => {
  const responses: string[] = [];
  const questions: string[] = [];

  for (const questionId of questionIds) {
    //check for hidden field Ids
    if (survey.hiddenFields.fieldIds?.includes(questionId)) {
      responses.push(processResponseData(pipelineData.response.data[questionId]));
      questions.push(questionId);
      continue;
    }
    const question = survey?.questions.find((q) => q.id === questionId);
    if (!question) {
      continue;
    }

    const responseValue = pipelineData.response.data[questionId];

    if (responseValue !== undefined) {
      let answer: typeof responseValue;
      if (question.type === TSurveyQuestionTypeEnum.PictureSelection) {
        const selectedChoiceIds = responseValue as string[];
        answer = question?.choices
          .filter((choice) => selectedChoiceIds.includes(choice.id))
          .map((choice) => choice.imageUrl)
          .join("\n");
      } else {
        answer = responseValue;
      }

      responses.push(processResponseData(answer));
    } else {
      responses.push("");
    }
    questions.push(getLocalizedValue(question?.headline, "default") || "");
  }

  return [responses, questions];
};

const handleNotionIntegration = async (
  integration: TIntegrationNotion,
  data: TPipelineInput,
  surveyData: TSurvey
) => {
  if (integration.config.data.length > 0) {
    for (const element of integration.config.data) {
      if (element.surveyId === data.surveyId) {
        const properties = buildNotionPayloadProperties(element.mapping, data, surveyData);
        await writeNotionData(element.databaseId, properties, integration.config);
      }
    }
  }
};

const buildNotionPayloadProperties = (
  mapping: TIntegrationNotionConfigData["mapping"],
  data: TPipelineInput,
  surveyData: TSurvey
) => {
  const properties: any = {};
  const responses = data.response.data;

  const mappingQIds = mapping
    .filter((m) => m.question.type === TSurveyQuestionTypeEnum.PictureSelection)
    .map((m) => m.question.id);

  Object.keys(responses).forEach((resp) => {
    if (mappingQIds.find((qId) => qId === resp)) {
      const selectedChoiceIds = responses[resp] as string[];
      const pictureQuestion = surveyData.questions.find((q) => q.id === resp);

      responses[resp] = (pictureQuestion as any)?.choices
        .filter((choice) => selectedChoiceIds.includes(choice.id))
        .map((choice) => choice.imageUrl);
    }
  });

  mapping.forEach((map) => {
    const value = responses[map.question.id];

    properties[map.column.name] = {
      [map.column.type]: getValue(map.column.type, processResponseData(value)),
    };
  });

  return properties;
};

// notion requires specific payload for each column type
// * TYPES NOT SUPPORTED BY NOTION API - rollup, created_by, created_time, last_edited_by, or last_edited_time
const getValue = (colType: string, value: string | string[] | number | Record<string, string>) => {
  try {
    switch (colType) {
      case "select":
        return {
          name: value,
        };
      case "multi_select":
        return (value as []).map((v: string) => ({ name: v }));
      case "title":
        return [
          {
            text: {
              content: value,
            },
          },
        ];
      case "rich_text":
        return [
          {
            text: {
              content: value,
            },
          },
        ];
      case "status":
        return {
          name: value,
        };
      case "checkbox":
        return value === "accepted" || value === "clicked";
      case "date":
        return {
          start: new Date(value as string).toISOString().substring(0, 10),
        };
      case "email":
        return value;
      case "number":
        return parseInt(value as string);
      case "phone_number":
        return value;
      case "url":
        return typeof value === "string" ? value : (value as string[]).join(", ");
    }
  } catch (error) {
    throw new Error("Payload build failed!");
  }
};
