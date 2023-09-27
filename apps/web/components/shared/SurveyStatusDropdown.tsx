"use client";

import LoadingSpinner from "@/components/shared/LoadingSpinner";
import SurveyStatusIndicator from "@/components/shared/SurveyStatusIndicator";
import { useSurveyMutation } from "@/lib/surveys/mutateSurveys";
import { useSurvey } from "@/lib/surveys/surveys";
import {
  ErrorComponent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@formbricks/ui";
import { CheckCircleIcon, PauseCircleIcon, PlayCircleIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

export default function SurveyStatusDropdown({
  surveyId,
  environmentId,
  updateLocalSurveyStatus,
}: {
  surveyId: string;
  environmentId: string;
  updateLocalSurveyStatus?: (status: "draft" | "inProgress" | "paused" | "completed" | "archived") => void;
}) {
  const { survey, isLoadingSurvey, isErrorSurvey } = useSurvey(environmentId, surveyId);
  const { triggerSurveyMutate } = useSurveyMutation(environmentId, surveyId);

  if (isLoadingSurvey) {
    return <LoadingSpinner />;
  }

  if (isErrorSurvey) {
    return <ErrorComponent />;
  }

  const isCloseOnDateEnabled = survey.closeOnDate !== null;
  const closeOnDate = survey.closeOnDate ? new Date(survey.closeOnDate) : null;
  const isStatusChangeDisabled = (isCloseOnDateEnabled && closeOnDate && closeOnDate < new Date()) ?? false;

  return (
    <>
      {survey.status === "draft" || survey.status === "archived" ? (
        <div className="flex items-center">
          <SurveyStatusIndicator status={survey.status} environmentId={environmentId} />
          {survey.status === "draft" && <p className="text-sm italic text-slate-600">Draft</p>}
          {survey.status === "archived" && <p className="text-sm italic text-slate-600">Archived</p>}
        </div>
      ) : (
        <Select
          value={survey.status}
          disabled={isStatusChangeDisabled}
          onValueChange={(value) => {
            triggerSurveyMutate({ status: value })
              .then(() => {
                toast.success(
                  value === "inProgress"
                    ? "Survey live"
                    : value === "paused"
                    ? "Survey paused"
                    : value === "completed"
                    ? "Survey completed"
                    : ""
                );
              })
              .catch((error) => {
                toast.error(`Error: ${error.message}`);
              });

            if (updateLocalSurveyStatus)
              updateLocalSurveyStatus(value as "draft" | "inProgress" | "paused" | "completed" | "archived");
          }}>
          <TooltipProvider delayDuration={50}>
            <Tooltip open={isStatusChangeDisabled ? undefined : false}>
              <TooltipTrigger asChild>
                <SelectTrigger className="w-[170px] bg-white py-6 md:w-[200px]">
                  <SelectValue>
                    <div className="flex items-center">
                      <SurveyStatusIndicator status={survey.status} environmentId={environmentId} />
                      <span className="ml-2 text-sm text-slate-700">
                        {survey.status === "draft" && "Draft"}
                        {survey.status === "inProgress" && "In-progress"}
                        {survey.status === "paused" && "Paused"}
                        {survey.status === "completed" && "Completed"}
                        {survey.status === "archived" && "Archived"}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
              </TooltipTrigger>
              <SelectContent className="bg-white">
                <SelectItem className="group  font-normal hover:text-slate-900" value="inProgress">
                  <PlayCircleIcon className="-mt-1 mr-1 inline h-5 w-5 text-slate-500 group-hover:text-slate-800" />
                  In-progress
                </SelectItem>
                <SelectItem className="group  font-normal hover:text-slate-900" value="paused">
                  <PauseCircleIcon className="-mt-1 mr-1 inline h-5 w-5 text-slate-500 group-hover:text-slate-800" />
                  Paused
                </SelectItem>
                <SelectItem className="group  font-normal hover:text-slate-900" value="completed">
                  <CheckCircleIcon className="-mt-1 mr-1 inline h-5 w-5 text-slate-500 group-hover:text-slate-800" />
                  Completed
                </SelectItem>
              </SelectContent>

              <TooltipContent>
                To update the survey status, update the &ldquo;Close
                <br /> survey on date&rdquo; setting in the Response Options.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Select>
      )}
    </>
  );
}
