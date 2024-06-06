import { isValidCssSelector } from "@/app/lib/actionClass/actionClass";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon, Terminal } from "lucide-react";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import {
  TActionClass,
  TActionClassInput,
  TActionClassInputCode,
  ZActionClassInput,
} from "@formbricks/types/actionClasses";
import { TSurvey } from "@formbricks/types/surveys";
import { CssSelector, InnerHtmlSelector, PageUrlSelector } from "@formbricks/ui/Actions";
import { Alert, AlertDescription, AlertTitle } from "@formbricks/ui/Alert";
import { Button } from "@formbricks/ui/Button";
import { FormControl, FormError, FormField, FormItem, FormLabel } from "@formbricks/ui/Form";
import { Input } from "@formbricks/ui/Input";
import { TabToggle } from "@formbricks/ui/TabToggle";

import { createActionClassAction } from "../actions";

interface CreateNewActionTabProps {
  actionClasses: TActionClass[];
  setActionClasses: React.Dispatch<React.SetStateAction<TActionClass[]>>;
  isViewer: boolean;
  setLocalSurvey?: React.Dispatch<React.SetStateAction<TSurvey>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  environmentId: string;
}

export const CreateNewActionTab = ({
  actionClasses,
  setActionClasses,
  setOpen,
  isViewer,
  setLocalSurvey,
  environmentId,
}: CreateNewActionTabProps) => {
  const [isCssSelector, setIsCssSelector] = useState(false);
  const [isInnerHtml, setIsInnerText] = useState(false);

  const actionClassNames = useMemo(
    () => actionClasses.map((actionClass) => actionClass.name),
    [actionClasses]
  );

  const form = useForm<TActionClassInput>({
    defaultValues: {
      name: "",
      description: "",
      environmentId,
      type: "noCode",
      noCodeConfig: {
        type: "click",
        elementSelector: {
          cssSelector: "",
          innerHtml: "",
        },
        urlFilters: [],
      },
    },
    resolver: zodResolver(
      ZActionClassInput.superRefine((data, ctx) => {
        if (data.name && actionClassNames.includes(data.name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["name"],
            message: `Action with name ${data.name} already exists`,
          });
        }
      })
    ),
    mode: "onChange",
  });

  const { control, handleSubmit, watch, reset } = form;
  const { isSubmitting } = form.formState;

  const actionClassKeys = useMemo(() => {
    const codeActionClasses: TActionClassInputCode[] = actionClasses.filter(
      (actionClass) => actionClass.type === "code"
    ) as TActionClassInputCode[];

    return codeActionClasses.map((actionClass) => actionClass.key);
  }, [actionClasses]);

  const submitHandler = async (data: TActionClassInput) => {
    const { type } = data;
    try {
      if (isViewer) {
        throw new Error("You are not authorised to perform this action.");
      }

      if (data.name && actionClassNames.includes(data.name)) {
        throw new Error(`Action with name ${data.name} already exist`);
      }

      if (type === "code" && data.key && actionClassKeys.includes(data.key)) {
        throw new Error(`Action with key ${data.key} already exist`);
      }

      if (
        data.type === "noCode" &&
        data.noCodeConfig?.type === "click" &&
        isCssSelector &&
        !isValidCssSelector(data.noCodeConfig.elementSelector.cssSelector)
      ) {
        throw new Error("Invalid CSS Selector");
      }

      let updatedAction = {};

      if (type === "noCode") {
        updatedAction = {
          name: data.name.trim(),
          description: data.description,
          environmentId,
          type: "noCode",
          noCodeConfig: {
            ...data.noCodeConfig,
            ...(data.type === "noCode" &&
              data.noCodeConfig?.type === "click" && {
                elementSelector: {
                  cssSelector:
                    isCssSelector && data.noCodeConfig.elementSelector.cssSelector
                      ? data.noCodeConfig.elementSelector.cssSelector
                      : undefined,
                  innerHtml:
                    isInnerHtml && data.noCodeConfig.elementSelector.innerHtml
                      ? data.noCodeConfig.elementSelector.innerHtml
                      : undefined,
                },
              }),
          },
        };
      } else if (type === "code") {
        updatedAction = {
          name: data.name.trim(),
          description: data.description,
          environmentId,
          type: "code",
          key: data.key,
        };
      }

      const newActionClass: TActionClass = await createActionClassAction(updatedAction as TActionClassInput);
      if (setActionClasses) {
        setActionClasses((prevActionClasses: TActionClass[]) => [...prevActionClasses, newActionClass]);
      }

      if (setLocalSurvey) {
        setLocalSurvey((prev) => ({
          ...prev,
          triggers: prev.triggers.concat({ actionClass: newActionClass }),
        }));
      }

      reset();
      resetAllStates();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const resetAllStates = () => {
    setIsCssSelector(false);
    setIsInnerText(false);
    reset();
    setOpen(false);
  };

  return (
    <div>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(submitHandler)}>
          <div className="max-h-[400px] w-full space-y-4 overflow-y-auto">
            <div className="grid w-full grid-cols-2 gap-x-4">
              <div className="col-span-1">
                <FormField
                  control={control}
                  name="name"
                  render={({ field, fieldState: { error } }) => (
                    <FormItem>
                      <FormLabel htmlFor="actionNameInput">What did your user do?</FormLabel>

                      <FormControl>
                        <Input
                          type="text"
                          id="actionNameInput"
                          {...field}
                          placeholder="E.g. Clicked Download"
                          isInvalid={!!error?.message}
                        />
                      </FormControl>

                      <FormError />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1">
                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="actionDescriptionInput">Description</FormLabel>

                      <FormControl>
                        <Input
                          type="text"
                          id="actionDescriptionInput"
                          {...field}
                          placeholder="User clicked Download Button"
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <hr className="border-slate-200" />

            <div className="w-3/5">
              <FormField
                name={`type`}
                control={control}
                render={({ field }) => (
                  <TabToggle
                    id="type"
                    label="Type"
                    options={[
                      { value: "noCode", label: "No code" },
                      { value: "code", label: "Code" },
                    ]}
                    {...field}
                    defaultSelected={field.value}
                  />
                )}
              />
            </div>

            {watch("type") === "code" ? (
              <>
                <div className="col-span-1">
                  <FormField
                    control={control}
                    name="key"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel htmlFor="codeActionKeyInput">Key</FormLabel>

                        <FormControl>
                          <Input
                            id="codeActionKeyInput"
                            placeholder="e.g. download_cta_click_on_home"
                            {...field}
                            className="mb-2 w-1/2"
                            value={field.value ?? ""}
                            isInvalid={!!error?.message}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Alert className="bg-slate-100">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>How do Code Actions work?</AlertTitle>
                  <AlertDescription>
                    You can track code action anywhere in your app using{" "}
                    <span className="rounded bg-white px-2 py-1 text-xs">
                      formbricks.track(&quot;{watch("key")}&quot;)
                    </span>{" "}
                    in your code. Read more in our{" "}
                    <a href="https://formbricks.com/docs/actions/code" target="_blank" className="underline">
                      docs
                    </a>
                    .
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div>
                <FormField
                  name={`noCodeConfig.type`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <TabToggle
                          id="userAction"
                          {...field}
                          defaultSelected={field.value}
                          label="What is the user doing?"
                          options={[
                            { value: "click", label: "Click" },
                            { value: "pageView", label: "Page View" },
                            { value: "exitIntent", label: "Exit Intent" },
                            { value: "fiftyPercentScroll", label: "50% Scroll" },
                          ]}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="mt-2">
                  {watch("noCodeConfig.type") === "click" && (
                    <FormField
                      control={control}
                      name="noCodeConfig.elementSelector"
                      render={() => (
                        <FormItem>
                          <FormControl>
                            <>
                              <CssSelector
                                isCssSelector={isCssSelector}
                                setIsCssSelector={setIsCssSelector}
                                control={control}
                              />
                              <InnerHtmlSelector
                                isInnerHtml={isInnerHtml}
                                setIsInnerHtml={setIsInnerText}
                                control={control}
                              />
                            </>
                          </FormControl>
                          <FormError />
                        </FormItem>
                      )}
                    />
                  )}
                  {watch("noCodeConfig.type") === "pageView" && (
                    <Alert>
                      <InfoIcon className=" h-4 w-4" />
                      <AlertTitle>Page View</AlertTitle>
                      <AlertDescription>
                        This action will be triggered when the page is loaded.
                      </AlertDescription>
                    </Alert>
                  )}
                  {watch("noCodeConfig.type") === "exitIntent" && (
                    <Alert>
                      <InfoIcon className=" h-4 w-4" />
                      <AlertTitle>Exit Intent</AlertTitle>
                      <AlertDescription>
                        This action will be triggered when the user tries to leave the page.
                      </AlertDescription>
                    </Alert>
                  )}
                  {watch("noCodeConfig.type") === "fiftyPercentScroll" && (
                    <Alert>
                      <InfoIcon className=" h-4 w-4" />
                      <AlertTitle>50% Scroll</AlertTitle>
                      <AlertDescription>
                        This action will be triggered when the user scrolls 50% of the page.
                      </AlertDescription>
                    </Alert>
                  )}
                  <PageUrlSelector form={form} />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-6">
            <div className="flex space-x-2">
              <Button type="button" variant="minimal" onClick={resetAllStates}>
                Cancel
              </Button>
              <Button variant="darkCTA" type="submit" loading={isSubmitting}>
                Create action
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
