"use client";

import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";

const options = [
  {
    id: "once",
    name: "Show once",
    description: "Every person can see this survey only once.",
  },
  {
    id: "always",
    name: "Show always",
    description: "Show this survey every time the trigger is fired.",
  },
];

interface RecontactOptionsCardProps {
  showSetting: "once" | "always";
  setShowSetting: (showSetting: "once" | "always") => void;
}

export default function RecontactOptionsCard({ showSetting, setShowSetting }: RecontactOptionsCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className="w-full space-y-2 rounded-lg border border-slate-300 bg-white">
      <Collapsible.CollapsibleTrigger asChild className="h-full w-full cursor-pointer">
        <div className="inline-flex px-4 py-6">
          <div className="flex items-center pr-5 pl-2">
            {!showSetting ? (
              <div className="h-7 w-7 rounded-full border border-slate-400" />
            ) : (
              <CheckCircleIcon className="h-8 w-8 text-teal-400" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">Recontact Options</p>
            <p className="mt-1 truncate text-sm text-slate-500">
              Decide how often people can answer this survey.
            </p>
          </div>
        </div>
      </Collapsible.CollapsibleTrigger>
      <Collapsible.CollapsibleContent>
        <hr className="py-1 text-slate-600" />
        <div className="p-3">
          <RadioGroup
            value={showSetting}
            className="flex flex-col space-y-3"
            onValueChange={(v) => {
              if (v === "always" || v === "once") setShowSetting(v);
            }}>
            {options.map((option) => (
              <Label
                htmlFor={option.id}
                className="flex w-full cursor-pointer items-center rounded-lg border bg-slate-50 p-4">
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  className="aria-checked:border-brand-dark  mx-5 disabled:border-slate-400 aria-checked:border-2"
                />
                <div className="">
                  <p className="font-semibold text-slate-700">{option.name}</p>

                  <p className="mt-2 text-xs font-normal text-slate-600">{option.description}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>
      </Collapsible.CollapsibleContent>
    </Collapsible.Root>
  );
}
