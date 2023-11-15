import { SurveyBaseProps } from "../types/props";
import { Survey } from "./Survey";

export function SurveyInline({
  survey,
  brandColor,
  isBrandingEnabled,
  activeQuestionId,
  onDisplay = () => {},
  onActiveQuestionChange = () => {},
  onResponse = () => {},
  onClose = () => {},
  prefillResponseData,
  isRedirectDisabled = false,
}: SurveyBaseProps) {
  return (
    <div id="fbjs" className="h-full w-full">
      <Survey
        survey={survey}
        brandColor={brandColor}
        isBrandingEnabled={isBrandingEnabled}
        activeQuestionId={activeQuestionId}
        onDisplay={onDisplay}
        onActiveQuestionChange={onActiveQuestionChange}
        onResponse={onResponse}
        onClose={onClose}
        prefillResponseData={prefillResponseData}
        isRedirectDisabled={isRedirectDisabled}
      />
    </div>
  );
}
