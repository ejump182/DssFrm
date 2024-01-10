import { RefObject } from "react";

import { TSurveyQuestion } from "@formbricks/types/surveys";
import { Button } from "@formbricks/ui/Button";
import { Input } from "@formbricks/ui/Input";

interface FallbackInputProps {
  filteredRecallQuestions: (TSurveyQuestion | undefined)[];
  fallbacks: { [type: string]: string };
  setFallbacks: (fallbacks: { [type: string]: string }) => void;
  fallbackInputRef: RefObject<HTMLInputElement>;
  addFallback: () => void;
}
export default function FallbackInput({
  filteredRecallQuestions,
  fallbacks,
  setFallbacks,
  fallbackInputRef,
  addFallback,
}: FallbackInputProps) {
  return (
    <div className="fixed z-30 mt-1 rounded-md border border-slate-300 bg-slate-50 p-3 text-xs">
      <p className="font-medium">Add a placeholder to show if the question gets skipped:</p>
      {filteredRecallQuestions.map((recallQuestion) => (
        <div className="mt-2 flex flex-col">
          <div className="flex items-center">
            <Input
              className="placeholder:text-md h-full bg-white"
              ref={fallbackInputRef}
              id="fallback"
              value={fallbacks[recallQuestion!.id]?.replaceAll("nbsp", " ")}
              onChange={(e) => {
                const newFallbacks = { ...fallbacks };
                newFallbacks[recallQuestion!.id] = e.target.value;
                setFallbacks(newFallbacks);
              }}
            />
          </div>
        </div>
      ))}
      <div className="flex w-full justify-end">
        <Button
          className="mt-2 h-full py-2"
          disabled={
            Object.values(fallbacks)
              .map((value) => value.trim())
              .includes("") || Object.entries(fallbacks).length === 0
          }
          variant="darkCTA"
          onClick={(e) => {
            e.preventDefault();
            addFallback();
          }}>
          Add
        </Button>
      </div>
    </div>
  );
}
