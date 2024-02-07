"use client";

import { UserGroupIcon } from "@heroicons/react/24/solid";

import { TActionClass } from "@formbricks/types/actionClasses";
import { TAttributeClass } from "@formbricks/types/attributeClasses";
import { TSegment } from "@formbricks/types/segment";
import ModalWithTabs from "@formbricks/ui/ModalWithTabs";

import SegmentActivityTab from "./SegmentActivityTab";
import SegmentSettingsTab from "./SegmentSettingsTab";

interface EditSegmentModalProps {
  environmentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  currentSegment: TSegment & {
    activeSurveys: string[];
    inactiveSurveys: string[];
  };
  segments: TSegment[];
  attributeClasses: TAttributeClass[];
  actionClasses: TActionClass[];
}

export default function EditSegmentModal({
  environmentId,
  open,
  setOpen,
  currentSegment,
  actionClasses,
  attributeClasses,
  segments,
}: EditSegmentModalProps) {
  const tabs = [
    {
      title: "Activity",
      children: <SegmentActivityTab environmentId={environmentId} currentSegment={currentSegment} />,
    },
    {
      title: "Settings",
      children: (
        <SegmentSettingsTab
          setOpen={setOpen}
          environmentId={environmentId}
          initialSegment={currentSegment}
          actionClasses={actionClasses}
          attributeClasses={attributeClasses}
          segments={segments}
        />
      ),
    },
  ];

  return (
    <>
      <ModalWithTabs
        open={open}
        setOpen={setOpen}
        tabs={tabs}
        icon={<UserGroupIcon />}
        label={currentSegment.title}
        description={currentSegment.description || ""}
        closeOnOutsideClick={false}
      />
    </>
  );
}
