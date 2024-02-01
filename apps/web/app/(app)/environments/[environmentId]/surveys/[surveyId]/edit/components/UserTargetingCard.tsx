"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";
import * as Collapsible from "@radix-ui/react-collapsible";
import { FilterIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@formbricks/lib/cn";
import { TAttributeClass } from "@formbricks/types/attributeClasses";
import { TSurvey } from "@formbricks/types/surveys";
import { TBaseFilter, TUserSegment } from "@formbricks/types/userSegment";
import { Button } from "@formbricks/ui/Button";
import { UpgradePlanNotice } from "@formbricks/ui/UpgradePlanNotice";

import BasicAddFilterModal from "./BasicAddFilterModal";
import BasicSegmentEditor from "./BasicSegmentEditor";

interface UserTargetingCardProps {
  localSurvey: TSurvey;
  setLocalSurvey: React.Dispatch<React.SetStateAction<TSurvey>>;
  environmentId: string;
  attributeClasses: TAttributeClass[];
}

export default function UserTargetingCard({
  localSurvey,
  setLocalSurvey,
  environmentId,
  attributeClasses,
}: UserTargetingCardProps) {
  const [userSegment, setUserSegment] = useState<TUserSegment | null>(localSurvey.userSegment);
  const [open, setOpen] = useState(false);
  const [addFilterModalOpen, setAddFilterModalOpen] = useState(false);

  const handleAddFilterInGroup = (filter: TBaseFilter) => {
    const updatedUserSegment = structuredClone(userSegment);

    if (updatedUserSegment?.filters?.length === 0) {
      updatedUserSegment.filters.push({
        ...filter,
        connector: null,
      });
    } else {
      updatedUserSegment?.filters.push(filter);
    }

    setUserSegment(updatedUserSegment);
  };

  useEffect(() => {
    setLocalSurvey((localSurveyOld) => ({
      ...localSurveyOld,
      userSegment,
    }));
  }, [setLocalSurvey, userSegment]);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className={cn(
        open ? "" : "hover:bg-slate-50",
        "w-full space-y-2 rounded-lg border border-slate-300 bg-white"
      )}>
      <Collapsible.CollapsibleTrigger asChild className="h-full w-full cursor-pointer">
        <div className="inline-flex px-4 py-4">
          <div className="flex items-center pl-2 pr-5">
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Target Audience</p>
            <p className="mt-1 text-sm text-slate-500">
              Pre-segment your target audience by attribute, action and device.
            </p>
          </div>
        </div>
      </Collapsible.CollapsibleTrigger>
      <Collapsible.CollapsibleContent>
        <hr className="py-1 text-slate-600" />
        <div className="flex flex-col gap-2 px-6 pt-2">
          <div className="mb-2 flex w-full items-center gap-4 px-5 py-3 text-slate-700">
            {!userSegment?.filters?.length ? (
              <div className="flex items-center gap-4">
                <UsersIcon className="h-5 w-5 text-slate-700" />
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium">
                    Audience: <span className="font-bold">Everyone</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Without a filter, all of your users can be surveyed.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4">
                  <FilterIcon className="h-5 w-5 text-slate-700" />
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium">
                      Audience: <span className="font-bold">Targeted</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Only people who match your targeting can be surveyed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="filter-scrollbar flex flex-col gap-4 overflow-auto rounded-lg border border-slate-300 bg-slate-50 p-4">
            <div className="flex w-full flex-col gap-2">
              <p className="text-sm font-semibold text-slate-800">Send survey to audience who match...</p>
              {!!userSegment?.filters?.length && (
                <div className="w-full">
                  <BasicSegmentEditor
                    key={userSegment.id}
                    group={userSegment.filters}
                    environmentId={environmentId}
                    userSegment={userSegment}
                    setUserSegment={setUserSegment}
                    attributeClasses={attributeClasses}
                  />
                </div>
              )}

              <div className="mt-4 flex items-center gap-4">
                <Button variant="secondary" size="sm" onClick={() => setAddFilterModalOpen(true)}>
                  Add filter
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 pt-3">
          <UpgradePlanNotice
            message="For advanced user targeting,"
            url={`/environments/${environmentId}/settings/billing`}
            textForUrl="please use Pro (free to get started)."
          />
        </div>

        <BasicAddFilterModal
          onAddFilter={(filter) => {
            handleAddFilterInGroup(filter);
          }}
          open={addFilterModalOpen}
          setOpen={setAddFilterModalOpen}
          attributeClasses={attributeClasses}
        />
      </Collapsible.CollapsibleContent>
    </Collapsible.Root>
  );
}
