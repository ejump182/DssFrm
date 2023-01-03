import { computePosition, flip, shift } from "@floating-ui/dom";
import { createFocusTrap } from "focus-trap";

import { formHTML } from "./form-html";
import formCSS from "./form.css";

export interface FormbricksConfig {
  contact: {
    name: string;
    position: string;
    imgUrl: string;
  };
  style?: any;
  formId?: string;
  hqUrl?: string;
  customer?: Record<any, any>;
  disableErrorAlert: boolean;
}

const config: FormbricksConfig = {
  customer: {},
  disableErrorAlert: false,
  // Merge with existing config
  ...(window as any).formbricks?.config,
};

function init() {
  // add css to head
  const styleElement = document.createElement("style");
  styleElement.id = "formbricks__css";
  styleElement.innerHTML = formCSS;

  document.head.insertBefore(styleElement, document.head.firstChild);

  // add feedback button listener
  document.querySelectorAll("[data-formbricks-button]").forEach((el) => {
    el.addEventListener("click", open);
  });
}
window.addEventListener("load", init);

const containerElement = document.createElement("div");
containerElement.id = "formbricks__container";

const trap = createFocusTrap(containerElement, {
  // initialFocus: "#formbricks__radio--idea",
  allowOutsideClick: true,
});

function applyConfig() {
  if (config.contact) {
    const contactNameElements = document.getElementsByClassName("formbricks__contact-name");
    for (const elem of contactNameElements) {
      elem.innerHTML = config.contact.name;
    }
  }
  const contactPositionElements = document.getElementsByClassName("formbricks__contact-position");
  for (const elem of contactPositionElements) {
    elem.innerHTML = config.contact.position;
  }
  const contactImageElements = document.getElementsByClassName("formbricks__contact-image");
  for (const elem of contactImageElements) {
    (<HTMLImageElement>elem).src = config.contact.imgUrl;
  }
  // apply styles
  const root = document.querySelector(":root") as HTMLElement;
  if (root !== null) {
    root.style.setProperty("--formbricks-header-bg-color", config.style.headerBgColor || "#e5e7eb");
    root.style.setProperty("--formbricks-header-text-color", config.style.headerTextColor || "#374151");
  }
}

function open(e: Event) {
  document.body.appendChild(containerElement);
  containerElement.innerHTML = formHTML;

  applyConfig();
  containerElement.style.display = "block";

  const target = (e?.target as HTMLElement) || document.body;
  computePosition(target, containerElement, {
    placement: "bottom",
    middleware: [flip(), shift({ crossAxis: true, padding: 8 })],
    strategy: "fixed",
  }).then(({ x, y }) => {
    Object.assign(containerElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });

  trap.activate();

  document.getElementById("formbricks__close")!.addEventListener("click", close);

  Array.from(containerElement.getElementsByClassName("formbricks__radio")).forEach((el) => {
    el.addEventListener("click", changeType);
  });

  document.getElementById("formbricks__type-switch")!.addEventListener("click", resetType);

  document.getElementById("formbricks__form")!.addEventListener("submit", submit);
}

function close() {
  trap.deactivate();

  containerElement.innerHTML = "";

  containerElement.remove();
  containerElement.removeAttribute("data-feedback-type");
  containerElement.removeAttribute("data-success");
}

function resetType(e: Event) {
  document.getElementById("formbricks__type-switch")!.innerHTML = "";
  containerElement.removeAttribute("data-feedback-type");
}

function changeType(e: Event) {
  const feedbackType = (e.target as HTMLInputElement).value;

  containerElement.setAttribute("data-feedback-type", feedbackType);

  let placeholder = "";
  if (feedbackType === "bug") placeholder = "I tried to do this but it is not working because...";
  else if (feedbackType === "compliment") placeholder = "I want to say Thank you for...";
  else if (feedbackType === "idea") placeholder = "I would love to...";

  document.getElementById("formbricks__message")?.setAttribute("placeholder", placeholder);

  let contactTitle = "";
  if (feedbackType === "bug") contactTitle = "What is not working anymore?";
  else if (feedbackType === "compliment") contactTitle = "Thanks a lot for sharing this!";
  else if (feedbackType === "idea") contactTitle = "What’s your idea?";
  const contactMessageElem = document.getElementById("formbricks__contact-placeholder");
  if (contactMessageElem !== null) {
    contactMessageElem.innerText = contactTitle;
  }

  // set type switch
  const typeSwitchElem = document.getElementById("formbricks__type-switch");
  const typeElem = document.getElementById(`formbricks__radio-label--${feedbackType}`);
  if (typeSwitchElem !== null && typeElem !== null) {
    // replace children with feedback type elements (icon & text)
    typeSwitchElem.innerHTML = "";
    typeSwitchElem.replaceChildren(...typeElem.cloneNode(true).childNodes);
    // add chevron
    const chevronElem = document.createElement("div");
    chevronElem.innerHTML = `<svg class="formbricks__radio-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>`;
    typeSwitchElem.appendChild(chevronElem);
  }
}

function submit(e: Event) {
  e.preventDefault();
  const target = e.target as HTMLFormElement;

  if (!config.formId) {
    console.error("Formbricks: No formId provided");
    if (!config.disableErrorAlert) alert("Unable to send feedback: No formId provided");
    return;
  }

  const submitElement = document.getElementById("formbricks__submit")!;
  submitElement.setAttribute("disabled", "");
  submitElement.innerHTML = "Sending…";

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  const body = {
    data: {
      feedbackType: (target.elements as any).feedbackType.value,
      message: (target.elements as any).message.value,
    },
    customer: config.customer,
  };

  fetch(`${config.hqUrl || "https://xm.formbricks.com"}/api/capture/forms/${config.formId}/submissions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
    .then(() => {
      containerElement.setAttribute("data-success", "");
      const feedbackType = containerElement.getAttribute("data-feedback-type");
      let successTitle = "";
      let successSubtitle = "";
      if (feedbackType === "bug") {
        successTitle = "Feedback received.";
        successSubtitle = "We are doing our best to fix this asap. Thank you!";
      } else if (feedbackType === "compliment") {
        successTitle = "Thanks for sharing!";
        successSubtitle = "We’re working hard on this. Your warm words make it fun!";
      } else if (feedbackType === "idea") {
        successTitle = "Brainstorming in progress...";
        successSubtitle = "We’ll look into it and get back to you. Thank you!";
      }
      document.getElementById("formbricks__success-title")!.innerText = successTitle;
      document.getElementById("formbricks__success-subtitle")!.innerText = successSubtitle;
    })
    .catch((e) => {
      console.error("Formbricks:", e);
      if (!config.disableErrorAlert) alert(`Could not send feedback: ${e.message}`);
    });

  return false;
}

const formbricks = { init, open, changeType, close, submit, config };
(window as any).formbricks = formbricks;

export default formbricks;
