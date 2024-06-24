import { SurveyInline } from "@/components/general/SurveyInline";
import { SurveyModal } from "@/components/general/SurveyModal";
import { addCustomThemeToDom, addStylesToDom } from "@/lib/styles";
import { h, render } from "preact";
import { SurveyInlineProps, SurveyModalProps } from "@formbricks/types/formbricksSurveys";

export const renderSurveyInline = (props: SurveyInlineProps) => {
  console.log("rendering-------------------------");
  console.log("here2");
  addStylesToDom();
  addCustomThemeToDom({ styling: props.styling });
  console.log("here");

  const element = document.getElementById(props.containerId);
  console.log(element);
  if (!element) {
    throw new Error(`renderSurvey: Element with id ${props.containerId} not found.`);
  }
  render(h(SurveyInline, props), element);
};

export const renderSurveyModal = (props: SurveyModalProps) => {
  addStylesToDom();
  addCustomThemeToDom({ styling: props.styling });

  // add container element to DOM
  const element = document.createElement("div");
  element.id = "formbricks-modal-container";
  document.body.appendChild(element);
  render(h(SurveyModal, props), element);
};

if (typeof window !== "undefined") {
  window.formbricksSurveys = {
    renderSurveyInline,
    renderSurveyModal,
  };
}
