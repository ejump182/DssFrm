import { RadioGroup } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { SurveyElement } from "./engineTypes";

interface IconRadioProps {
  element: SurveyElement;
  field: any;
  control: any;
  onSubmit: () => void;
  disabled: boolean;
}

export default function IconRadio({ element, control, onSubmit, disabled }: IconRadioProps) {
  const value = useWatch({
    control,
    name: element.field!!,
  });

  useEffect(() => {
    if (value && !disabled) {
      onSubmit();
    }
  }, [value, onSubmit, disabled]);

  return (
    <Controller
      name={element.field!}
      control={control}
      rules={{ required: true }}
      render={({ field }: { field: any }) => (
        <RadioGroup className="flex flex-col justify-center" {...field}>
          <RadioGroup.Label className="text-center text-lg font-bold text-gray-700 dark:text-gray-100">
            {element.label}
          </RadioGroup.Label>

          <div
            className={clsx(
              element.options && element.options.length >= 4
                ? "lg:grid-cols-4"
                : element.options?.length === 3
                ? "lg:grid-cols-3"
                : element.options?.length === 2
                ? "lg:grid-cols-2"
                : "lg:grid-cols-1",
              "mt-4 grid w-full gap-y-6 sm:gap-x-4"
            )}>
            {element.options &&
              element.options.map((option) => (
                <RadioGroup.Option
                  key={option.value}
                  value={option.value}
                  className={({ checked, active }) =>
                    clsx(
                      checked ? "border-transparent" : "border-gray-200 dark:border-slate-700",
                      active ? "border-brand ring-brand ring-2" : "",
                      "relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all ease-in-out hover:scale-105 focus:outline-none dark:bg-slate-700"
                    )
                  }>
                  {({ checked, active }) => (
                    <>
                      <div className="flex flex-1 flex-col justify-center">
                        {option.frontend?.icon && (
                          <option.frontend.icon
                            className="text-brand mx-auto mb-3 h-8 w-8"
                            aria-hidden="true"
                          />
                        )}
                        <RadioGroup.Label
                          as="span"
                          className="mx-auto text-sm font-medium text-gray-900 dark:text-gray-200">
                          {option.label}
                        </RadioGroup.Label>
                      </div>

                      <CheckCircleIcon
                        className={clsx(
                          !checked ? "invisible" : "",
                          "text-brand absolute -right-2 -top-2 z-10 h-5 w-5 rounded-full bg-white"
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={clsx(
                          active ? "border" : "border-2",
                          checked ? "border-brand" : "border-transparent",
                          "pointer-events-none absolute -inset-px rounded-lg"
                        )}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </RadioGroup.Option>
              ))}
          </div>
        </RadioGroup>
      )}
    />
  );
}
