"use client";

import { useResponseFilter } from "@/app/(app)/environments/[environmentId]/components/ResponseFilterContext";
import { getPaginatedResponses } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/actions";
import SurveyResultsTabs from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/components/SurveyResultsTabs";
import ResponseTimeline from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/responses/components/ResponseTimeline";
import CustomFilter from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/CustomFilter";
import SummaryHeader from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/SummaryHeader";
import { getFilterResponses, getFormattedFilters } from "@/app/lib/surveys/surveys";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { checkForRecallInHeadline } from "@formbricks/lib/utils/recall";
import { TEnvironment } from "@formbricks/types/environment";
import { TMembershipRole } from "@formbricks/types/memberships";
import { TProduct } from "@formbricks/types/product";
import { TResponse } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys";
import { TTag } from "@formbricks/types/tags";
import { TUser } from "@formbricks/types/user";
import ContentWrapper from "@formbricks/ui/ContentWrapper";

import ResultsShareButton from "../../../components/ResultsShareButton";

interface ResponsePageProps {
  environment: TEnvironment;
  survey: TSurvey;
  surveyId: string;
  webAppUrl: string;
  product: TProduct;
  user: TUser;
  environmentTags: TTag[];
  responsesPerPage: number;
  membershipRole?: TMembershipRole;
}

const ResponsePage = ({
  environment,
  survey,
  surveyId,
  webAppUrl,
  product,
  user,
  environmentTags,
  responsesPerPage,
  membershipRole,
}: ResponsePageProps) => {
  const [initialResponses, setInitialResponses] = useState<TResponse[]>();
  const { selectedFilter, dateRange, resetState } = useResponseFilter();

  const apiFilters = useMemo(
    () => getFormattedFilters(selectedFilter, dateRange),
    [selectedFilter, dateRange]
  );

  const searchParams = useSearchParams();
  survey = useMemo(() => {
    return checkForRecallInHeadline(survey);
  }, [survey]);
  useEffect(() => {
    if (!searchParams?.get("referer")) {
      resetState();
    }
  }, [searchParams, resetState]);

  useEffect(() => {
    const fetchInitialResponses = async () => {
      const responses = await getPaginatedResponses(surveyId, 1, undefined, apiFilters);
      console.log({ responses });
      setInitialResponses(responses);
    };
    fetchInitialResponses();
  }, [surveyId, apiFilters]);

  const responses = useMemo(() => initialResponses || [], [initialResponses]);

  // get the filtered array when the selected filter value changes
  const filterResponses: TResponse[] = useMemo(() => {
    return getFilterResponses(responses, selectedFilter, survey, dateRange);
  }, [selectedFilter, responses, survey, dateRange]);
  return (
    <ContentWrapper>
      <SummaryHeader
        environment={environment}
        survey={survey}
        surveyId={surveyId}
        webAppUrl={webAppUrl}
        product={product}
        user={user}
        membershipRole={membershipRole}
      />
      <div className="flex gap-1.5">
        <CustomFilter
          environmentTags={environmentTags}
          responses={filterResponses}
          survey={survey}
          totalResponses={responses}
        />
        <ResultsShareButton survey={survey} webAppUrl={webAppUrl} product={product} user={user} />
      </div>
      <SurveyResultsTabs activeId="responses" environmentId={environment.id} surveyId={surveyId} />
      <ResponseTimeline
        environment={environment}
        surveyId={surveyId}
        responses={filterResponses}
        survey={survey}
        user={user}
        environmentTags={environmentTags}
        responsesPerPage={responsesPerPage}
      />
    </ContentWrapper>
  );
};

export default ResponsePage;
