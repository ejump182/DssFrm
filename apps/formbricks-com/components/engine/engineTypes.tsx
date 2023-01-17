export interface SurveyOption {
  label: string;
  value: string;
  frontend?: any;
}

export interface SurveyPage {
  id: string;
  endScreen?: boolean;
  elements: SurveyElement[];
  config?: {
    autoSubmit: boolean;
  };
  branchingRules?: {
    type: "value";
    field: string;
    value: string;
    nextPageId: string;
  }[];
}

export interface SurveyElement {
  id: string;
  field?: string;
  label?: string;
  type: "radio" | "text" | "checkbox" | "html";
  options?: SurveyOption[];
  component: React.FC<any>;
}

export interface Survey {
  pages: SurveyPage[];
}
