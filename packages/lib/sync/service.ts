import { TEnvironment } from "@formbricks/types/environment";
import { TJsState } from "@formbricks/types/js";
import { getActionClasses } from "../actionClass/service";
import { IS_FORMBRICKS_CLOUD, MAU_LIMIT, PRICING_USERTARGETING_FREE_MTU } from "../constants";
import { getEnvironment } from "../environment/service";
import { getPerson } from "../person/service";
import { getProductByEnvironmentId } from "../product/service";
import { getSyncSurveysCached } from "../survey/service";
import { getMonthlyActiveTeamPeopleCount, getTeamByEnvironmentId } from "../team/service";
import { captureTelemetry } from "../telemetry";

const captureNewSessionTelemetry = async (jsVersion?: string): Promise<void> => {
  await captureTelemetry("state update", { jsVersion: jsVersion ?? "unknown" });
};

export const getUpdatedState = async (
  environmentId: string,
  personId: string,
  jsVersion?: string
): Promise<TJsState> => {
  let environment: TEnvironment | null;

  if (jsVersion) {
    captureNewSessionTelemetry(jsVersion);
  }

  // check if environment exists
  environment = await getEnvironment(environmentId);

  if (!environment) {
    throw new Error("Environment does not exist");
  }

  // check team subscriptons
  const team = await getTeamByEnvironmentId(environmentId);

  if (!team) {
    throw new Error("Team does not exist");
  }

  // check if Monthly Active Users limit is reached
  if (IS_FORMBRICKS_CLOUD) {
    const hasUserTargetingSubscription =
      team?.billing?.features.userTargeting.status &&
      team?.billing?.features.userTargeting.status in ["active", "canceled"];
    const currentMau = await getMonthlyActiveTeamPeopleCount(team.id);
    const isMauLimitReached = !hasUserTargetingSubscription && currentMau >= PRICING_USERTARGETING_FREE_MTU;

    if (isMauLimitReached) {
      const errorMessage = `Monthly Active Users limit reached in ${environmentId} (${currentMau}/${MAU_LIMIT})`;
      throw new Error(errorMessage);

      // if (!personId) {
      //   // don't allow new people
      //   throw new Error(errorMessage);
      // }
      // const session = await getSession(sessionId);
      // if (!session) {
      //   // don't allow new sessions
      //   throw new Error(errorMessage);
      // }
      // // check if session was created this month (user already active this month)
      // const now = new Date();
      // const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      // if (new Date(session.createdAt) < firstDayOfMonth) {
      //   throw new Error(errorMessage);
      // }
    }
  }

  const person = await getPerson(personId);

  if (!person) {
    throw new Error("Person not found");
  }

  const [surveys, noCodeActionClasses, product] = await Promise.all([
    getSyncSurveysCached(environmentId, person),
    getActionClasses(environmentId),
    getProductByEnvironmentId(environmentId),
  ]);

  if (!product) {
    throw new Error("Product not found");
  }

  // return state
  const state: TJsState = {
    person: person!,
    surveys,
    noCodeActionClasses: noCodeActionClasses.filter((actionClass) => actionClass.type === "noCode"),
    product,
  };

  return state;
};
