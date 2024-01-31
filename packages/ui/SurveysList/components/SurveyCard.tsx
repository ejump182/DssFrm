import { Code, Link2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@formbricks/lib/cn";
import { timeSince } from "@formbricks/lib/time";
import { TEnvironment } from "@formbricks/types/environment";
import { TSurvey } from "@formbricks/types/surveys";

import { SurveyStatusIndicator } from "../../SurveyStatusIndicator";
import { generateSingleUseIdAction } from "../actions";
import SurveyDropDownMenu from "./SurveyDropdownMenu";

interface SurveyCardProps {
  survey: TSurvey;
  environment: TEnvironment;
  otherEnvironment: TEnvironment;
  isViewer: boolean;
  WEBAPP_URL: string;
  orientation: string;
}
export default function SurveyCard({
  survey,
  environment,
  otherEnvironment,
  isViewer,
  WEBAPP_URL,
  orientation,
}: SurveyCardProps) {
  const isSurveyCreationDeletionDisabled = isViewer;

  const surveyStatus = useMemo(() => {
    if (survey.status === "inProgress") return "Active";
    else if (survey.status === "completed") return "Completed";
    else if (survey.status === "draft") return "Draft";
    else if (survey.status === "paused") return "Paused";
  }, [survey]);
  const [singleUseId, setSingleUseId] = useState<string | undefined>();

  useEffect(() => {
    if (survey.singleUse?.enabled) {
      generateSingleUseIdAction(survey.id, survey.singleUse?.isEncrypted ? true : false).then(setSingleUseId);
    } else {
      setSingleUseId(undefined);
    }
  }, [survey]);

  const linkHref =
    survey.status === "draft"
      ? `/environments/${environment.id}/surveys/${survey.id}/edit`
      : `/environments/${environment.id}/surveys/${survey.id}/summary`;

  const renderGridContent = () => {
    return (
      <Link
        href={linkHref}
        key={survey.id}
        className="relative col-span-2 flex h-44 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all ease-in-out hover:scale-105 ">
        <div className="flex justify-between">
          {survey.type === "web" ? (
            <div className="flex items-center space-x-2 text-slate-500">
              <Code className="h-4 w-4" />
              <span> In-app</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-500">
              <Link2Icon className="h-4 w-4" />
              <span> Link</span>
            </div>
          )}
          <SurveyDropDownMenu
            survey={survey}
            key={`surveys-${survey.id}`}
            environmentId={environment.id}
            environment={environment}
            otherEnvironment={otherEnvironment!}
            webAppUrl={WEBAPP_URL}
            singleUseId={singleUseId}
            isSurveyCreationDeletionDisabled={isSurveyCreationDeletionDisabled}
          />
        </div>
        <div>
          <div className="text-xl font-medium text-slate-900">{survey.name}</div>
          <div
            className={cn(
              "mt-3 flex w-fit items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm text-slate-800",
              surveyStatus === "Active" && "bg-emerald-50",
              surveyStatus === "Completed" && "bg-slate-200",
              surveyStatus === "Draft" && "bg-slate-100",
              surveyStatus === "Paused" && "bg-slate-100"
            )}>
            <SurveyStatusIndicator status={survey.status} /> {surveyStatus}
          </div>
        </div>
      </Link>
    );
  };

  const renderListContent = () => {
    return (
      <Link
        href={linkHref}
        key={survey.id}
        className="relative grid w-full scale-[99%] grid-cols-8 gap-2 rounded-xl border border-slate-200 bg-white p-4
    shadow-sm transition-all ease-in-out hover:scale-[100%]">
        <div className="col-span-2 flex items-center overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-medium text-slate-900">
          {survey.name}
        </div>
        <div className="col-span-2 ml-2 flex gap-4">
          <div
            className={cn(
              "flex w-fit items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm text-slate-800",
              surveyStatus === "Active" && "bg-emerald-50",
              surveyStatus === "Completed" && "bg-slate-200",
              surveyStatus === "Draft" && "bg-slate-100",
              surveyStatus === "Paused" && "bg-slate-100"
            )}>
            <SurveyStatusIndicator status={survey.status} /> {surveyStatus}
          </div>

          <div className="flex justify-between">
            {survey.type === "web" ? (
              <div className="flex items-center space-x-2 text-slate-500">
                <Code className="h-4 w-4" />
                <span> In-app</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-slate-500">
                <Link2Icon className="h-4 w-4" />
                <span> Link</span>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1"></div>
        <div className="col-span-3 flex justify-between">
          <div className="ml-1 flex items-center">{timeSince(survey.createdAt.toString())}</div>
          <div className="ml-10 flex items-center">{timeSince(survey.updatedAt.toString())}</div>
          <div className="flex items-center justify-end">
            <SurveyDropDownMenu
              survey={survey}
              key={`surveys-${survey.id}`}
              environmentId={environment.id}
              environment={environment}
              otherEnvironment={otherEnvironment!}
              webAppUrl={WEBAPP_URL}
              singleUseId={singleUseId}
              isSurveyCreationDeletionDisabled={isSurveyCreationDeletionDisabled}
            />
          </div>
        </div>
      </Link>
    );
  };
  if (orientation === "grid") return renderGridContent();
  else return renderListContent();
}
