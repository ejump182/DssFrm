import SlackWrapper from "@/app/(app)/environments/[environmentId]/integrations/slack/components/SlackWrapper";

import { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, WEBAPP_URL } from "@formbricks/lib/constants";
import { getEnvironment } from "@formbricks/lib/environment/service";
import { getIntegrationByType } from "@formbricks/lib/integration/service";
import { getSlackChannels } from "@formbricks/lib/slack/service";
import { getSurveys } from "@formbricks/lib/survey/service";
import { TIntegrationItem } from "@formbricks/types/integration";
import { TIntegrationSlack } from "@formbricks/types/integration/slack";
import GoBackButton from "@formbricks/ui/GoBackButton";

export default async function Slack({ params }) {
  const isEnabled = !!(SLACK_CLIENT_ID && SLACK_CLIENT_SECRET);

  const [surveys, slackIntegration, environment] = await Promise.all([
    getSurveys(params.environmentId),
    getIntegrationByType(params.environmentId, "slack"),
    getEnvironment(params.environmentId),
  ]);

  if (!environment) {
    throw new Error("Environment not found");
  }

  let channelsArray: TIntegrationItem[] = [];
  if (slackIntegration && slackIntegration.config.key) {
    channelsArray = await getSlackChannels(params.environmentId);
  }

  return (
    <>
      <GoBackButton url={`/environments/${params.environmentId}/integrations`} />
      <div className="h-[75vh] w-full">
        <SlackWrapper
          isEnabled={isEnabled}
          environment={environment}
          channelsArray={channelsArray}
          surveys={surveys}
          slackIntegration={slackIntegration as TIntegrationSlack}
          webAppUrl={WEBAPP_URL}
        />
      </div>
    </>
  );
}
