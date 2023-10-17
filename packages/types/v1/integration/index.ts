import { z } from "zod";
import { ZGoogleSheetsConfig } from "./googleSheet";
import { ZAirTableConfig } from "./airTable";

export const ZIntegrationsTypes = z.enum(["googleSheets", "airtable"]);

export const ZIntegrationConfig = z.union([ZGoogleSheetsConfig, ZAirTableConfig]);

export const ZIntegration = z.object({
  id: z.string(),
  type: ZIntegrationsTypes,
  environmentId: z.string(),
  config: ZIntegrationConfig,
});

export const ZIntegrationBaseSurveyData = z.object({
  createdAt: z.date(),
  questionIds: z.array(z.string()),
  questions: z.string(),
  surveyId: z.string(),
  surveyName: z.string(),
});
