import { InvalidCodeError, NetworkError, Result, err, okVoid } from "../../shared/errors";
import { Logger } from "../../shared/logger";
import { WebsiteConfig } from "./config";
import { triggerSurvey } from "./widget";

const logger = Logger.getInstance();
const websiteConfig = WebsiteConfig.getInstance();

export const trackAction = async (name: string, alias?: string): Promise<Result<void, NetworkError>> => {
  alias = alias || name;
  logger.debug(`Formbricks: Action "${alias}" tracked`);

  // get a list of surveys that are collecting insights
  const activeSurveys = websiteConfig.get().state?.surveys;

  if (!!activeSurveys && activeSurveys.length > 0) {
    for (const survey of activeSurveys) {
      for (const trigger of survey.triggers) {
        if (trigger.name === name) {
          await triggerSurvey(survey, name);
        }
      }
    }
  } else {
    logger.debug("No active surveys to display");
  }

  return okVoid();
};

export const trackCodeAction = (
  code: string
): Promise<Result<void, NetworkError>> | Result<void, InvalidCodeError> => {
  const {
    state: { actionClasses },
  } = websiteConfig.get();

  let name = code;

  if (actionClasses) {
    const action = actionClasses.find((action) => action.key === code);
    if (!action) {
      return err({
        code: "invalid_code",
        message: `${code} action unknown. Please add this action in Formbricks first in order to use it in your code.`,
      });
    }
    name = action.name;
  }

  return trackAction(name, code);
};

export const trackNoCodeAction = (name: string): Promise<Result<void, NetworkError>> => {
  return trackAction(name);
};
