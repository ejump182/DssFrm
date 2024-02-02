"use client";

import { createId } from "@paralleldrive/cuid2";
import { MonitorSmartphoneIcon, MousePointerClick, TagIcon, Users2Icon } from "lucide-react";
import React, { useMemo, useState } from "react";

import { cn } from "@formbricks/lib/cn";
import { TActionClass } from "@formbricks/types/actionClasses";
import { TAttributeClass } from "@formbricks/types/attributeClasses";
import { TBaseFilter, TUserSegment, TUserSegmentAttributeFilter } from "@formbricks/types/userSegment";
import { Input } from "@formbricks/ui/Input";
import { Modal } from "@formbricks/ui/Modal";
import { TabBar } from "@formbricks/ui/TabBar";

type TAddFilterModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAddFilter: (filter: TBaseFilter) => void;
  actionClasses: TActionClass[];
  attributeClasses: TAttributeClass[];
  userSegments: TUserSegment[];
};

type TFilterType = "action" | "attribute" | "segment" | "device";

const AddFilterModal = ({
  onAddFilter,
  open,
  setOpen,
  actionClasses,
  attributeClasses,
  userSegments,
}: TAddFilterModalProps) => {
  const [activeTabId, setActiveTabId] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  const tabs: {
    id: string;
    label: string;
    icon?: React.ReactNode;
  }[] = [
    { id: "all", label: "All" },
    { id: "actions", label: "Actions", icon: <MousePointerClick className="h-4 w-4" /> },
    { id: "attributes", label: "Attributes", icon: <TagIcon className="h-4 w-4" /> },
    { id: "segments", label: "Segments", icon: <Users2Icon className="h-4 w-4" /> },
    { id: "devices", label: "Devices", icon: <MonitorSmartphoneIcon className="h-4 w-4" /> },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const devices = [
    { id: "phone", name: "Phone" },
    { id: "desktop", name: "Desktop" },
  ];

  const actionClassesFiltered = useMemo(() => {
    if (!actionClasses) return [];

    if (!searchValue) return actionClasses;

    return actionClasses.filter((actionClass) =>
      actionClass.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [actionClasses, searchValue]);

  const attributeClassesFiltered = useMemo(() => {
    if (!attributeClasses) return [];

    if (!searchValue) return attributeClasses;

    return attributeClasses.filter((attributeClass) =>
      attributeClass.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [attributeClasses, searchValue]);

  const userSegmentsFiltered = useMemo(() => {
    if (!userSegments) return [];

    if (!searchValue) return userSegments.filter((userSegment) => !userSegment.isPrivate);

    return userSegments
      .filter((userSegment) => !userSegment.isPrivate)
      .filter((userSegment) => userSegment.title.toLowerCase().includes(searchValue.toLowerCase()));
  }, [userSegments, searchValue]);

  const deviceTypesFiltered = useMemo(() => {
    if (!searchValue) return devices;

    return devices.filter((deviceType) => deviceType.name.toLowerCase().includes(searchValue.toLowerCase()));
  }, [devices, searchValue]);

  const allFiltersFiltered = useMemo(
    () => [
      {
        attributes: attributeClassesFiltered,
        actions: actionClassesFiltered,
        segments: userSegmentsFiltered,
        devices: deviceTypesFiltered,
      },
    ],
    [actionClassesFiltered, attributeClassesFiltered, deviceTypesFiltered, userSegmentsFiltered]
  );

  const handleAddFilter = ({
    type,
    attributeClassName,
    deviceType,
    actionClassId,
    userSegmentId,
    isUserId = false,
  }: {
    type: TFilterType;
    actionClassId?: string;
    attributeClassName?: string;
    userSegmentId?: string;
    deviceType?: string;
    isUserId?: boolean;
  }) => {
    if (type === "action") {
      if (!actionClassId) return;

      const newFilter: TBaseFilter = {
        id: createId(),
        connector: "and",
        resource: {
          id: createId(),
          root: {
            type: type,
            actionClassId,
          },
          qualifier: {
            metric: "occuranceCount",
            operator: "greaterThan",
          },
          value: "",
        },
      };

      onAddFilter(newFilter);
      setOpen(false);
    }

    if (type === "attribute") {
      if (!attributeClassName) return;

      const newFilterResource: TUserSegmentAttributeFilter = {
        id: createId(),
        root: {
          type,
          attributeClassName,
        },
        qualifier: {
          operator: "equals",
        },
        value: "",
        ...(isUserId && { meta: { isUserId } }),
      };
      const newFilter: TBaseFilter = {
        id: createId(),
        connector: "and",
        resource: newFilterResource,
      };

      onAddFilter(newFilter);
      setOpen(false);
    }

    if (type === "segment") {
      if (!userSegmentId) return;

      const newFilter: TBaseFilter = {
        id: createId(),
        connector: "and",
        resource: {
          id: createId(),
          root: {
            type: type,
            userSegmentId,
          },
          qualifier: {
            operator: "userIsIn",
          },
          value: userSegmentId,
        },
      };

      onAddFilter(newFilter);
      setOpen(false);
    }

    if (type === "device") {
      if (!deviceType) return;

      const newFilter: TBaseFilter = {
        id: createId(),
        connector: "and",
        resource: {
          id: createId(),
          root: {
            type: type,
            deviceType,
          },
          qualifier: {
            operator: "equals",
          },
          value: deviceType,
        },
      };

      onAddFilter(newFilter);
      setOpen(false);
    }
  };

  const getAllTabContent = () => {
    return (
      <>
        {allFiltersFiltered?.every((filterArr) => {
          return (
            filterArr.actions.length === 0 &&
            filterArr.attributes.length === 0 &&
            filterArr.segments.length === 0 &&
            filterArr.devices.length === 0
          );
        }) && (
          <div className="flex w-full items-center justify-center gap-4 rounded-lg px-2 py-1 text-sm">
            <p>There are no filters yet!</p>
          </div>
        )}

        {allFiltersFiltered.map((filters) => {
          return (
            <>
              {filters.actions.map((actionClass) => {
                return (
                  <div
                    onClick={() => {
                      handleAddFilter({
                        type: "action",
                        actionClassId: actionClass.id,
                      });
                    }}
                    className="flex cursor-pointer items-center gap-4 rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
                    <MousePointerClick className="h-4 w-4" />
                    <p>{actionClass.name}</p>
                  </div>
                );
              })}

              {filters.attributes.map((attributeClass) => {
                return (
                  <div
                    onClick={() => {
                      handleAddFilter({
                        type: "attribute",
                        attributeClassName: attributeClass.name,
                        isUserId: attributeClass.name === "userId" && attributeClass.type === "automatic",
                      });
                    }}
                    className="flex cursor-pointer items-center gap-4 rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
                    <TagIcon className="h-4 w-4" />
                    <p>{attributeClass.name}</p>
                  </div>
                );
              })}

              {filters.segments.map((userSegment) => {
                return (
                  <div
                    onClick={() => {
                      handleAddFilter({
                        type: "segment",
                        userSegmentId: userSegment.id,
                      });
                    }}
                    className="flex cursor-pointer items-center gap-4 rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
                    <Users2Icon className="h-4 w-4" />
                    <p>{userSegment.title}</p>
                  </div>
                );
              })}

              {filters.devices.map((deviceType) => (
                <div
                  key={deviceType.id}
                  className="flex cursor-pointer items-center gap-4 rounded-lg px-2 py-1 text-sm hover:bg-slate-50"
                  onClick={() => {
                    handleAddFilter({
                      type: "device",
                      deviceType: deviceType.id,
                    });
                  }}>
                  <MonitorSmartphoneIcon className="h-4 w-4" />
                  <span>{deviceType.name}</span>
                </div>
              ))}
            </>
          );
        })}
      </>
    );
  };

  const getActionsTabContent = () => {
    return (
      <>
        {actionClassesFiltered?.length === 0 && (
          <div className="flex w-full items-center justify-center gap-4 rounded-lg px-2 py-1 text-sm">
            <p>There are no actions yet!</p>
          </div>
        )}
        {actionClassesFiltered.map((actionClass) => {
          return (
            <div
              onClick={() => {
                handleAddFilter({
                  type: "action",
                  actionClassId: actionClass.id,
                });
              }}
              className="flex cursor-pointer items-center gap-4 rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
              <MousePointerClick className="h-4 w-4" />
              <p>{actionClass.name}</p>
            </div>
          );
        })}
      </>
    );
  };

  const getAttributesTabContent = () => {
    return (
      <>
        {attributeClassesFiltered?.length === 0 && (
          <div className="flex w-full items-center justify-center gap-4 rounded-lg px-2 py-1 text-sm">
            <p>There are no attributes available</p>
          </div>
        )}
        {attributeClassesFiltered.map((attributeClass) => {
          return (
            <div
              onClick={() => {
                handleAddFilter({
                  type: "attribute",
                  attributeClassName: attributeClass.name,
                  isUserId: attributeClass.name === "userId" && attributeClass.type === "automatic",
                });
              }}
              className="flex cursor-pointer items-center gap-4 rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
              <TagIcon className="h-4 w-4" />
              <p>{attributeClass.name}</p>
            </div>
          );
        })}
      </>
    );
  };

  const getSegmentsTabContent = () => {
    return (
      <>
        {userSegmentsFiltered?.length === 0 && (
          <div className="flex w-full items-center justify-center gap-4 rounded-lg px-2 py-1 text-sm">
            <p>You currently have no saved segments.</p>
          </div>
        )}
        {userSegmentsFiltered
          ?.filter((segment) => !segment.isPrivate)
          ?.map((userSegment) => {
            return (
              <div
                onClick={() => {
                  handleAddFilter({
                    type: "segment",
                    userSegmentId: userSegment.id,
                  });
                }}
                className="flex cursor-pointer items-center gap-4 rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
                <Users2Icon className="h-4 w-4" />
                <p>{userSegment.title}</p>
              </div>
            );
          })}
      </>
    );
  };

  const getDevicesTabContent = () => {
    return (
      <div className="flex flex-col">
        {deviceTypesFiltered.map((deviceType) => (
          <div
            key={deviceType.id}
            className="flex cursor-pointer items-center gap-4 rounded-lg px-2 py-1 text-sm hover:bg-slate-50"
            onClick={() => {
              handleAddFilter({
                type: "device",
                deviceType: deviceType.id,
              });
            }}>
            <MonitorSmartphoneIcon className="h-4 w-4" />
            <span>{deviceType.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const TabContent = (): JSX.Element => {
    switch (activeTabId) {
      case "all": {
        return getAllTabContent();
      }
      case "actions": {
        return getActionsTabContent();
      }
      case "attributes": {
        return getAttributesTabContent();
      }
      case "segments": {
        return getSegmentsTabContent();
      }
      case "devices": {
        return getDevicesTabContent();
      }
      default: {
        return getAllTabContent();
      }
    }
  };

  return (
    <Modal hideCloseButton open={open} setOpen={setOpen} closeOnOutsideClick>
      <div className="flex w-auto flex-col">
        <Input placeholder="Browse filters..." autoFocus onChange={(e) => setSearchValue(e.target.value)} />
        <TabBar className="bg-white" tabs={tabs} activeId={activeTabId} setActiveId={setActiveTabId} />
      </div>

      <div className={cn("mt-2 flex max-h-80 flex-col gap-1 overflow-y-auto")}>
        <TabContent />
      </div>
    </Modal>
  );
};

export default AddFilterModal;
