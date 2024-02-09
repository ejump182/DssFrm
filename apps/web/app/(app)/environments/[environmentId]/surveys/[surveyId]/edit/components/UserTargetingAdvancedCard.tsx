"use client";

import UserTargetingFallback from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/edit/components/UserTargetingFallback";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import * as Collapsible from "@radix-ui/react-collapsible";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AddFilterModal from "@formbricks/ee/advancedUserTargeting/components/AddFilterModal";
import SegmentEditor from "@formbricks/ee/advancedUserTargeting/components/SegmentEditor";
import {
  cloneSegmentAction,
  createSegmentAction,
  loadNewSegmentAction,
  updateSegmentAction,
} from "@formbricks/ee/advancedUserTargeting/lib/actions";
import { ACTIONS_TO_EXCLUDE } from "@formbricks/ee/advancedUserTargeting/lib/constants";
import { TActionClass } from "@formbricks/types/actionClasses";
import { TAttributeClass } from "@formbricks/types/attributeClasses";
import { TBaseFilter, TSegment, TSegmentUpdateInput } from "@formbricks/types/segment";
import { TSurvey } from "@formbricks/types/surveys";
import AlertDialog from "@formbricks/ui/AlertDialog";
import { Button } from "@formbricks/ui/Button";
import LoadSegmentModal from "@formbricks/ui/Targeting/LoadSegmentModal";
import SaveAsNewSegmentModal from "@formbricks/ui/Targeting/SaveAsNewSegmentModal";

interface UserTargetingAdvancedCardProps {
  localSurvey: TSurvey;
  setLocalSurvey: React.Dispatch<React.SetStateAction<TSurvey>>;
  environmentId: string;
  actionClasses: TActionClass[];
  attributeClasses: TAttributeClass[];
  segments: TSegment[];
  initialSegment?: TSegment;
}

export default function UserTargetingAdvancedCard({
  localSurvey,
  setLocalSurvey,
  environmentId,
  actionClasses: actionClassesProps,
  attributeClasses,
  segments,
  initialSegment,
}: UserTargetingAdvancedCardProps) {
  const [open, setOpen] = useState(false);
  const [segment, setSegment] = useState<TSegment | null>(localSurvey.segment);

  const [addFilterModalOpen, setAddFilterModalOpen] = useState(false);
  const [saveAsNewSegmentModalOpen, setSaveAsNewSegmentModalOpen] = useState(false);
  const [resetAllFiltersModalOpen, setResetAllFiltersModalOpen] = useState(false);
  const [loadSegmentModalOpen, setLoadSegmentModalOpen] = useState(false);
  const [loadSegmentModalStep, setLoadSegmentModalStep] = useState<"initial" | "load">("initial");
  const [isSegmentEditorOpen, setIsSegmentEditorOpen] = useState(!!localSurvey.segment?.isPrivate);
  const [segmentEditorViewOnly, setSegmentEditorViewOnly] = useState(true);

  const actionClasses = actionClassesProps.filter((actionClass) => {
    if (actionClass.type === "automatic") {
      if (ACTIONS_TO_EXCLUDE.includes(actionClass.name)) {
        return false;
      }

      return true;
    }

    return true;
  });

  useEffect(() => {
    setLocalSurvey((localSurveyOld) => ({
      ...localSurveyOld,
      segment: segment,
    }));
  }, [setLocalSurvey, segment]);

  const isSegmentUsedInOtherSurveys = useMemo(
    () => (localSurvey?.segment ? localSurvey.segment?.surveys?.length > 1 : false),
    [localSurvey.segment]
  );

  const handleCloneSegment = async () => {
    if (!segment) return;

    try {
      const clonedSegment = await cloneSegmentAction(segment.id, localSurvey.id);
      setSegment(clonedSegment);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (!!segment && segment?.filters?.length > 0) {
      setOpen(true);
    }
  }, [segment, segment?.filters?.length]);

  useEffect(() => {
    if (localSurvey.type === "link") {
      setOpen(false);
    }
  }, [localSurvey.type]);

  const handleAddFilterInGroup = (filter: TBaseFilter) => {
    const updatedSegment = structuredClone(segment);
    if (updatedSegment?.filters?.length === 0) {
      updatedSegment.filters.push({
        ...filter,
        connector: null,
      });
    } else {
      updatedSegment?.filters.push(filter);
    }

    setSegment(updatedSegment);
  };

  const handleLoadNewSegment = async (surveyId: string, segmentId: string) => {
    const updatedSurvey = await loadNewSegmentAction(surveyId, segmentId);
    return updatedSurvey;
  };

  const handleSaveAsNewSegment = async (
    environmentId: string,
    segmentId: string,
    data: TSegmentUpdateInput
  ) => {
    const updatedSegment = await updateSegmentAction(environmentId, segmentId, data);
    return updatedSegment;
  };

  if (localSurvey.type === "link") {
    return null; // Hide card completely
  }

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className="w-full rounded-lg border border-slate-300 bg-white">
      <Collapsible.CollapsibleTrigger
        asChild
        className="h-full w-full cursor-pointer rounded-lg hover:bg-slate-50">
        <div className="inline-flex px-4 py-6">
          <div className="flex items-center pl-2 pr-5">
            <CheckCircleIcon className="h-8 w-8 text-green-400 " />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Target Audience</p>
            <p className="mt-1 text-sm text-slate-500">Pre-segment your users with attributes filters.</p>
          </div>
        </div>
      </Collapsible.CollapsibleTrigger>
      <Collapsible.CollapsibleContent className="min-w-full overflow-auto">
        <hr className="text-slate-600" />

        <div className="flex flex-col gap-5 p-6">
          <UserTargetingFallback segment={segment} />

          <div className="filter-scrollbar flex flex-col gap-4 overflow-auto rounded-lg border border-slate-300 bg-slate-50 p-4">
            {!!segment && (
              <LoadSegmentModal
                open={loadSegmentModalOpen}
                setOpen={setLoadSegmentModalOpen}
                surveyId={localSurvey.id}
                step={loadSegmentModalStep}
                setStep={setLoadSegmentModalStep}
                currentSegment={segment}
                segments={segments}
                setSegment={setSegment}
                setIsSegmentEditorOpen={setIsSegmentEditorOpen}
                onSegmentLoad={handleLoadNewSegment}
              />
            )}

            {isSegmentEditorOpen ? (
              <div className="w-full">
                <div className="mb-4">
                  {!segment?.isPrivate ? (
                    <div className="mb-2 flex items-center gap-6">
                      <UserGroupIcon className="h-6 w-6 text-slate-700" />
                      <div className="flex flex-col">
                        <h3 className="font-medium text-slate-900">{localSurvey.segment?.title}</h3>
                        <p className="text-sm text-slate-500">{localSurvey.segment?.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Send survey to audience who match...
                      </p>
                    </div>
                  )}
                </div>
                {!!segment?.filters?.length && (
                  <div className="w-full">
                    <SegmentEditor
                      key={segment.filters.toString()}
                      group={segment.filters}
                      environmentId={environmentId}
                      segment={segment}
                      setSegment={setSegment}
                      actionClasses={actionClasses}
                      attributeClasses={attributeClasses}
                      segments={segments}
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setAddFilterModalOpen(true)}>
                    Add filter
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setSegmentEditorViewOnly(true)}>
                    Save changes
                  </Button>
                  {/* 
                    {isSegmentEditorOpen && !!segment?.filters?.length && (
                      <Button
                        variant="minimal"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => setResetAllFiltersModalOpen(true)}>
                        <p className="text-sm">Reset all filters</p>
                      </Button>
                    )} */}

                  {isSegmentEditorOpen && !segment?.isPrivate && !!segment?.filters?.length && (
                    <Button
                      variant="minimal"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        setIsSegmentEditorOpen(false);
                        setSegmentEditorViewOnly(true);

                        if (initialSegment) {
                          setSegment(initialSegment);
                        }
                      }}>
                      Cancel
                    </Button>
                  )}
                </div>

                <>
                  <AddFilterModal
                    onAddFilter={(filter) => {
                      handleAddFilterInGroup(filter);
                    }}
                    open={addFilterModalOpen}
                    setOpen={setAddFilterModalOpen}
                    actionClasses={actionClasses}
                    attributeClasses={attributeClasses}
                    segments={segments}
                  />
                  {!!segment && (
                    <SaveAsNewSegmentModal
                      open={saveAsNewSegmentModalOpen}
                      setOpen={setSaveAsNewSegmentModalOpen}
                      localSurvey={localSurvey}
                      segment={segment}
                      setSegment={setSegment}
                      setIsSegmentEditorOpen={setIsSegmentEditorOpen}
                      onCreateSegment={async (data) => createSegmentAction(data)}
                      onUpdateSegment={handleSaveAsNewSegment}
                    />
                  )}

                  <AlertDialog
                    headerText="Are you sure?"
                    open={resetAllFiltersModalOpen}
                    setOpen={setResetAllFiltersModalOpen}
                    mainText="This action resets all filters in this survey."
                    declineBtnLabel="Cancel"
                    onDecline={() => {
                      setResetAllFiltersModalOpen(false);
                    }}
                    confirmBtnLabel="Remove all filters"
                    onConfirm={() => {
                      const updatedSegment = structuredClone(segment);
                      if (updatedSegment?.filters) {
                        updatedSegment.filters = [];
                      }

                      setSegment(updatedSegment);
                      setResetAllFiltersModalOpen(false);
                    }}
                  />
                </>
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-lg">
                <div className="mb-2 flex items-center gap-6">
                  <UserGroupIcon className="h-6 w-6 text-slate-700" />
                  <div className="flex flex-col">
                    <h3 className="font-medium text-slate-900">{localSurvey.segment?.title}</h3>
                    <p className="text-sm text-slate-500">{localSurvey.segment?.description}</p>
                  </div>
                </div>

                {segmentEditorViewOnly && segment && (
                  <div className="opacity-60">
                    <SegmentEditor
                      key={segment.filters.toString()}
                      group={segment.filters}
                      environmentId={environmentId}
                      segment={segment}
                      actionClasses={actionClasses}
                      attributeClasses={attributeClasses}
                      segments={segments}
                      setSegment={setSegment}
                      viewOnly={segmentEditorViewOnly}
                    />
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSegmentEditorViewOnly(!segmentEditorViewOnly);
                    }}>
                    {segmentEditorViewOnly ? "Hide" : "View"} Filters{" "}
                    {segmentEditorViewOnly ? (
                      <ChevronDownIcon className="ml-2 h-3 w-3" />
                    ) : (
                      <ChevronUpIcon className="ml-2 h-3 w-3" />
                    )}
                  </Button>

                  {isSegmentUsedInOtherSurveys && (
                    <Button variant="secondary" size="sm" onClick={() => handleCloneSegment()}>
                      Clone & Edit Segment
                    </Button>
                  )}
                  <Button
                    variant={isSegmentUsedInOtherSurveys ? "minimal" : "secondary"}
                    size="sm"
                    onClick={() => {
                      setIsSegmentEditorOpen(true);
                      setSegmentEditorViewOnly(false);
                    }}>
                    Edit Segment
                    <PencilIcon className="ml-2 h-3 w-3" />
                  </Button>
                  {isSegmentUsedInOtherSurveys && (
                    <p className="text-xs text-slate-600">
                      This segment is used in other surveys. Make changes{" "}
                      <Link href={`/environments/${environmentId}/segments`} target="_blank">
                        here.
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setLoadSegmentModalOpen(true)}>
              Load Segment
            </Button>

            {isSegmentEditorOpen && !!segment?.filters?.length && (
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setSaveAsNewSegmentModalOpen(true)}>
                Save as new Segment
              </Button>
            )}
          </div>
        </div>
      </Collapsible.CollapsibleContent>
    </Collapsible.Root>
  );
}
