"use client";

import { useResponseFilter } from "@/app/(app)/environments/[environmentId]/components/ResponseFilterContext";
import {
  getResponseCountAction,
  getResponsesAction,
} from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/actions";
import { SurveyResultsTabs } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/components/SurveyResultsTabs";
import ResponseTimeline from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/responses/components/ResponseTimeline";
import { CustomFilter } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/CustomFilter";
import { ResultsShareButton } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/ResultsShareButton";
import { SummaryHeader } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/SummaryHeader";
import { getFormattedFilters } from "@/app/lib/surveys/surveys";
import {
  getResponseCountBySurveySharingKeyAction,
  getResponsesBySurveySharingKeyAction,
} from "@/app/share/[sharingKey]/action";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { checkForRecallInHeadline } from "@formbricks/lib/utils/recall";
import { TEnvironment } from "@formbricks/types/environment";
import { TMembershipRole } from "@formbricks/types/memberships";
import { TProduct } from "@formbricks/types/product";
import { TResponse } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys";
import { TTag } from "@formbricks/types/tags";
import { TUser } from "@formbricks/types/user";
import { ContentWrapper } from "@formbricks/ui/ContentWrapper";

interface ResponsePageProps {
  environment: TEnvironment;
  survey: TSurvey;
  surveyId: string;
  webAppUrl: string;
  product: TProduct;
  user?: TUser;
  environmentTags: TTag[];
  responsesPerPage: number;
  membershipRole?: TMembershipRole;
  totalResponseCount: number;
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
  totalResponseCount,
}: ResponsePageProps) => {
  const params = useParams();
  const sharingKey = params.sharingKey as string;
  const isSharingPage = !!sharingKey;

  const [responseCount, setResponseCount] = useState<number | null>(null);
  const [responses, setResponses] = useState<TResponse[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingFirstPage, setFetchingFirstPage] = useState<boolean>(true);

  const { selectedFilter, dateRange, resetState } = useResponseFilter();

  const filters = useMemo(
    () => getFormattedFilters(survey, selectedFilter, dateRange),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedFilter, dateRange]
  );

  const searchParams = useSearchParams();

  survey = useMemo(() => {
    return checkForRecallInHeadline(survey, "default");
  }, [survey]);

  const fetchNextPage = useCallback(async () => {
    const newPage = page + 1;

    let newResponses: TResponse[] = [];

    if (isSharingPage) {
      newResponses = await getResponsesBySurveySharingKeyAction(
        sharingKey,
        newPage,
        responsesPerPage,
        filters
      );
    } else {
      newResponses = await getResponsesAction(surveyId, newPage, responsesPerPage, filters);
    }

    if (newResponses.length === 0 || newResponses.length < responsesPerPage) {
      setHasMore(false);
    }
    setResponses([...responses, ...newResponses]);
    setPage(newPage);
  }, [filters, isSharingPage, page, responses, responsesPerPage, sharingKey, surveyId]);

  const deleteResponse = (responseId: string) => {
    setResponses(responses.filter((response) => response.id !== responseId));
    if (responseCount) {
      setResponseCount(responseCount - 1);
    }
  };

  const updateResponse = (responseId: string, updatedResponse: TResponse) => {
    setResponses(responses.map((response) => (response.id === responseId ? updatedResponse : response)));
  };

  useEffect(() => {
    if (!searchParams?.get("referer")) {
      resetState();
    }
  }, [searchParams, resetState]);

  useEffect(() => {
    const handleResponsesCount = async () => {
      let responseCount = 0;

      if (isSharingPage) {
        responseCount = await getResponseCountBySurveySharingKeyAction(sharingKey, filters);
      } else {
        responseCount = await getResponseCountAction(surveyId, filters);
      }

      setResponseCount(responseCount);
    };
    handleResponsesCount();
  }, [filters, isSharingPage, sharingKey, surveyId]);

  useEffect(() => {
    const fetchInitialResponses = async () => {
      try {
        setFetchingFirstPage(true);

        let responses: TResponse[] = [];

        if (isSharingPage) {
          responses = await getResponsesBySurveySharingKeyAction(sharingKey, 1, responsesPerPage, filters);
        } else {
          responses = await getResponsesAction(surveyId, 1, responsesPerPage, filters);
        }

        if (responses.length < responsesPerPage) {
          setHasMore(false);
        }
        setResponses(responses);
      } finally {
        setFetchingFirstPage(false);
      }
    };
    fetchInitialResponses();
  }, [surveyId, filters, responsesPerPage, sharingKey, isSharingPage]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setResponses([]);
  }, [filters]);

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
        <CustomFilter survey={survey} />
        {!isSharingPage && <ResultsShareButton survey={survey} webAppUrl={webAppUrl} user={user} />}
      </div>
      <SurveyResultsTabs
        activeId="responses"
        environmentId={environment.id}
        surveyId={surveyId}
        responseCount={responseCount}
      />
      <ResponseTimeline
        environment={environment}
        surveyId={surveyId}
        responses={responses}
        survey={survey}
        user={user}
        environmentTags={environmentTags}
        fetchNextPage={fetchNextPage}
        hasMore={hasMore}
        deleteResponse={deleteResponse}
        updateResponse={updateResponse}
        isFetchingFirstPage={isFetchingFirstPage}
        responseCount={responseCount}
        totalResponseCount={totalResponseCount}
        isSharingPage={isSharingPage}
      />
    </ContentWrapper>
  );
};

export default ResponsePage;
