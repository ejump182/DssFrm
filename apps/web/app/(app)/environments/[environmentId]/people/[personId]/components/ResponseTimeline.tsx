"use client";

import ResponseFeed from "@/app/(app)/environments/[environmentId]/people/[personId]/components/ResponsesFeed";
import { TResponse } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys";
import { TEnvironment } from "@formbricks/types/environment";
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { TTag } from "@formbricks/types/tags";
import { TUser } from "@formbricks/types/user";

export default function ResponseTimeline({
  surveys,
  user,
  environment,
  responses,
  environmentTags,
}: {
  surveys: TSurvey[];
  user: TUser;
  responses: TResponse[];
  environment: TEnvironment;
  environmentTags: TTag[];
}) {
  const [responsesAscending, setResponsesAscending] = useState(false);
  const [sortedResponses, setSortedResponses] = useState(responses);
  const toggleSortResponses = () => {
    setResponsesAscending(!responsesAscending);
  };

  useEffect(() => {
    setSortedResponses(responsesAscending ? [...responses].reverse() : responses);
  }, [responsesAscending]);

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between pb-6">
        <h2 className="text-lg font-bold text-slate-700">Responses</h2>
        <div className="text-right">
          <button
            onClick={toggleSortResponses}
            className="hover:text-brand-dark flex items-center px-1 text-slate-800">
            <ArrowsUpDownIcon className="inline h-4 w-4" />
          </button>
        </div>
      </div>
      <ResponseFeed
        responses={sortedResponses}
        environment={environment}
        surveys={surveys}
        user={user}
        environmentTags={environmentTags}
      />
    </div>
  );
}
