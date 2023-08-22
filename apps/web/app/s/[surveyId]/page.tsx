export const revalidate = REVALIDATION_INTERVAL;

import { REVALIDATION_INTERVAL } from "@formbricks/lib/constants";
import LinkSurvey from "@/app/s/[surveyId]/LinkSurvey";
import LegalFooter from "@/app/s/[surveyId]/LegalFooter";
import { getSurvey } from "@formbricks/lib/services/survey";
import { getProductByEnvironmentId } from "@formbricks/lib/services/product";
import SurveyInactive from "@/app/s/[surveyId]/SurveyInactive";

export default async function LinkSurveyPage({ params }) {
  const [survey, product] = await Promise.all([
    getSurvey(params.surveyId),
    getProductByEnvironmentId(params.environmentId),
  ]);

  if (survey && survey.status !== "inProgress") {
    return <SurveyInactive status={survey.status} surveyClosedMessage={survey.surveyClosedMessage} />;
  }

  if (survey === null) {
    return <SurveyInactive status="not found" />;
  }

  return (
    <>
      {survey && (
        <>
          <LinkSurvey survey={survey} product={product} />
          <LegalFooter />
        </>
      )}
    </>
  );
}
