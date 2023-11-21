import { TResponseData } from "@formbricks/types/responses";
import type { TSurveyFileUploadQuestion } from "@formbricks/types/surveys";
import { BackButton } from "../buttons/BackButton";
import SubmitButton from "../buttons/SubmitButton";
import FileInput from "../general/FileInput";
import Headline from "../general/Headline";
import Subheader from "../general/Subheader";

interface FileUploadQuestionProps {
  question: TSurveyFileUploadQuestion;
  value: string | number | string[];
  onChange: (responseData: TResponseData) => void;
  onSubmit: (data: TResponseData) => void;
  onBack: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  surveyId: string;
  environmentId: string;
}

export default function FileUploadQuestion({
  question,
  value,
  onChange,
  onSubmit,
  onBack,
  isFirstQuestion,
  isLastQuestion,
  surveyId,
  environmentId,
}: FileUploadQuestionProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (question.required) {
          if (value && (typeof value === "string" || Array.isArray(value)) && value.length > 0) {
            onSubmit({ [question.id]: typeof value === "string" ? [value] : value });
          } else {
            alert("Please upload a file");
          }
        } else {
          if (value) {
            onSubmit({ [question.id]: typeof value === "string" ? [value] : value });
          } else {
            onSubmit({ [question.id]: "skipped" });
          }
        }
      }}
      className="w-full">
      <Headline headline={question.headline} questionId={question.id} required={question.required} />
      <Subheader subheader={question.subheader} questionId={question.id} />

      <FileInput
        environmentId={environmentId}
        surveyId={surveyId}
        onFileUpload={(urls: string[]) => {
          if (urls) {
            onChange({ [question.id]: urls });
          } else {
            onChange({ [question.id]: "skipped" });
          }
        }}
        fileUrls={value as string[]}
        allowMultipleFiles={question.allowMultipleFiles}
        {...(!!question.allowedFileExtensions
          ? { allowedFileExtensions: question.allowedFileExtensions }
          : {})}
        {...(!!question.maxSizeInMB ? { maxSizeInMB: question.maxSizeInMB } : {})}
      />

      <div className="mt-4 flex w-full justify-between">
        {!isFirstQuestion && (
          <BackButton
            backButtonLabel={question.backButtonLabel}
            onClick={() => {
              onBack();
            }}
          />
        )}
        <div></div>
        <SubmitButton buttonLabel={question.buttonLabel} isLastQuestion={isLastQuestion} onClick={() => {}} />
      </div>
    </form>
  );
}
