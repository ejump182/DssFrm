import { TResponseData, TResponseUpdate } from "@formbricks/types/responses";
import { TUploadFileConfig } from "@formbricks/types/storage";
import { TSurvey } from "@formbricks/types/surveys";

export interface SurveyBaseProps {
  survey: TSurvey;
  isBrandingEnabled: boolean;
  activeQuestionId?: string;
  getSetIsError?: (getSetError: (value: boolean) => void) => void;
  onDisplay?: () => void;
  onResponse?: (response: TResponseUpdate) => void;
  onFinished?: () => void;
  onClose?: () => void;
  onActiveQuestionChange?: (questionId: string) => void;
  onRetry?: () => void;
  autoFocus?: boolean;
  isRedirectDisabled?: boolean;
  prefillResponseData?: TResponseData;
  brandColor: string;
  onFileUpload: (file: File, config?: TUploadFileConfig) => Promise<string>;
  responseCount?: number;
  supportEmail?: string | null;
}

export interface SurveyInlineProps extends SurveyBaseProps {
  containerId: string;
}

export interface SurveyModalProps extends SurveyBaseProps {
  clickOutside: boolean;
  darkOverlay: boolean;
  highlightBorderColor: string | null;
  placement: "bottomLeft" | "bottomRight" | "topLeft" | "topRight" | "center";
}
