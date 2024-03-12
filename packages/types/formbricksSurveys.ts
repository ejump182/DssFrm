import { TProductStyling } from "./product";
import { TResponseData, TResponseUpdate } from "./responses";
import { TUploadFileConfig } from "./storage";
import { TSurvey, TSurveyStyling } from "./surveys";

export interface SurveyBaseProps {
  survey: TSurvey;
  isBrandingEnabled: boolean;
  activeQuestionId?: string;
  getSetIsError?: (getSetError: (value: boolean) => void) => void;
  getSetIsResponseSendingFinished?: (getSetIsResponseSendingFinished: (value: boolean) => void) => void;
  onDisplay?: () => void;
  onResponse?: (response: TResponseUpdate) => void;
  onFinished?: () => void;
  onClose?: () => void;
  onActiveQuestionChange?: (questionId: string) => void;
  onRetry?: () => void;
  autoFocus?: boolean;
  isRedirectDisabled?: boolean;
  prefillResponseData?: TResponseData;
  onFileUpload: (file: File, config?: TUploadFileConfig) => Promise<string>;
  responseCount?: number;
  styling: TSurveyStyling | TProductStyling;
  isCardBorderVisible?: boolean;
}

export interface SurveyInlineProps extends SurveyBaseProps {
  containerId: string;
}

export interface SurveyModalProps extends SurveyBaseProps {
  clickOutside: boolean;
  darkOverlay: boolean;
  placement: "bottomLeft" | "bottomRight" | "topLeft" | "topRight" | "center";
}
