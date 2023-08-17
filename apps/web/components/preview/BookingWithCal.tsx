import type { BookingWithCal } from "@formbricks/types/questions";
import { cn } from "@/../../packages/lib/cn";
import { isLight } from "@/lib/utils";
import { Response } from "@formbricks/types/js";
import { BackButton } from "@/components/preview/BackButton";
import { TSurveyBookingWithCal } from "@formbricks/types/v1/surveys";
import Cal from "@calcom/embed-react";

interface BookingWithCalProps {
  question: BookingWithCal | TSurveyBookingWithCal;
  onSubmit: (data: { [x: string]: any }) => void;
  lastQuestion: boolean;
  brandColor: string;
  storedResponseValue: string | null;
  goToNextQuestion: (answer: Response["data"]) => void;
  goToPreviousQuestion?: (answer?: Response["data"]) => void;
}

export default function BookingWithCal({
  question,
  onSubmit,
  lastQuestion,
  brandColor,
  storedResponseValue,
  goToNextQuestion,
  goToPreviousQuestion,
}: BookingWithCalProps) {
  return (
    <div>
      <Cal
        key={question.label}
        calLink={question.label.length === 0 ? "rick" : question.label}
        config={{
          theme: "light",
        }}
      />

      <div className="mt-4 flex w-full justify-end">
        {goToPreviousQuestion && <BackButton onClick={() => goToPreviousQuestion()} />}
        <div></div>
        {(!question.required || storedResponseValue) && (
          <button
            type="button"
            onClick={() => {
              if (storedResponseValue) {
                goToNextQuestion({ [question.id]: "clicked" });
                return;
              }
              onSubmit({ [question.id]: "dismissed" });
            }}
            className="mr-4 flex items-center rounded-md px-3 py-3 text-base font-medium leading-4 text-slate-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-400 dark:text-slate-400">
            {storedResponseValue === "clicked" ? "Next" : "Skip"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onSubmit({ [question.id]: "clicked" });
          }}
          className={cn(
            "flex items-center rounded-md border border-transparent px-3 py-3 text-base font-medium leading-4 shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2",
            isLight(brandColor) ? "text-black" : "text-white"
          )}
          style={{ backgroundColor: brandColor }}>
          {question.buttonLabel || (lastQuestion ? "Finish" : "Next")}
        </button>
      </div>
    </div>
  );
}
