export const revalidate = 0;

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAnalysisData } from "@/app/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/data";
import { getServerSession } from "next-auth";
import ResponsesLimitReachedBanner from "../ResponsesLimitReachedBanner";
import SummaryPage from "./SummaryPage";

export default async function Page({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }
  const { responses, survey } = await getAnalysisData(session, params.surveyId, params.environmentId);

  return (
    <>
      <ResponsesLimitReachedBanner
        environmentId={params.environmentId}
        session={session}
        surveyId={params.surveyId}
      />
      <SummaryPage
        environmentId={params.environmentId}
        responses={responses}
        survey={survey}
        surveyId={params.surveyId}
      />
    </>
  );
}
