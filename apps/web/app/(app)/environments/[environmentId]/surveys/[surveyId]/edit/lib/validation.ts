// extend this object in order to add more validation rules
import { toast } from "react-hot-toast";

import { extractLanguageCodes, getLocalizedValue } from "@formbricks/lib/i18n/utils";
import {
  TI18nString,
  TSurveyCTAQuestion,
  TSurveyConsentQuestion,
  TSurveyLanguage,
  TSurveyMatrixQuestion,
  TSurveyMultipleChoiceMultiQuestion,
  TSurveyMultipleChoiceSingleQuestion,
  TSurveyOpenTextQuestion,
  TSurveyPictureSelectionQuestion,
  TSurveyQuestion,
  TSurveyQuestions,
  TSurveyThankYouCard,
  TSurveyWelcomeCard,
} from "@formbricks/types/surveys";

// Utility function to check if label is valid for all required languages
export const isLabelValidForAllLanguages = (
  label: TI18nString,
  surveyLanguages: TSurveyLanguage[]
): boolean => {
  const filteredLanguages = surveyLanguages.filter((surveyLanguages) => {
    return surveyLanguages.enabled;
  });
  const languageCodes = extractLanguageCodes(filteredLanguages);
  const languages = languageCodes.length === 0 ? ["default"] : languageCodes;
  return languages.every((language) => label && label[language] && label[language].trim() !== "");
};

// Validation logic for multiple choice questions
const handleI18nCheckForMultipleChoice = (
  question: TSurveyMultipleChoiceMultiQuestion | TSurveyMultipleChoiceSingleQuestion,
  languages: TSurveyLanguage[]
): boolean => {
  return question.choices.every((choice) => isLabelValidForAllLanguages(choice.label, languages));
};

const handleI18nCheckForMatrixLabels = (
  question: TSurveyMatrixQuestion,
  languages: TSurveyLanguage[]
): boolean => {
  const rowsAndColumns = [...question.rows, ...question.columns];
  return rowsAndColumns.every((label) => isLabelValidForAllLanguages(label, languages));
};

// Validation rules
export const validationRules = {
  openText: (question: TSurveyOpenTextQuestion, languages: TSurveyLanguage[]) => {
    return question.placeholder &&
      getLocalizedValue(question.placeholder, "default").trim() !== "" &&
      languages.length > 1
      ? isLabelValidForAllLanguages(question.placeholder, languages)
      : true;
  },
  multipleChoiceMulti: (question: TSurveyMultipleChoiceMultiQuestion, languages: TSurveyLanguage[]) => {
    return handleI18nCheckForMultipleChoice(question, languages);
  },
  multipleChoiceSingle: (question: TSurveyMultipleChoiceSingleQuestion, languages: TSurveyLanguage[]) => {
    return handleI18nCheckForMultipleChoice(question, languages);
  },
  consent: (question: TSurveyConsentQuestion, languages: TSurveyLanguage[]) => {
    return isLabelValidForAllLanguages(question.label, languages);
  },
  pictureSelection: (question: TSurveyPictureSelectionQuestion) => {
    return question.choices.length >= 2;
  },
  cta: (question: TSurveyCTAQuestion, languages: TSurveyLanguage[]) => {
    return !question.required && question.dismissButtonLabel
      ? isLabelValidForAllLanguages(question.dismissButtonLabel, languages)
      : true;
  },
  matrix: (question: TSurveyMatrixQuestion, languages: TSurveyLanguage[]) => {
    return handleI18nCheckForMatrixLabels(question, languages);
  },
  // Assuming headline is of type TI18nString
  defaultValidation: (question: TSurveyQuestion, languages: TSurveyLanguage[], isFirstQuestion: boolean) => {
    // headline and subheader are default for every question
    const isHeadlineValid = isLabelValidForAllLanguages(question.headline, languages);
    const isSubheaderValid =
      question.subheader &&
      getLocalizedValue(question.subheader, "default").trim() !== "" &&
      languages.length > 1
        ? isLabelValidForAllLanguages(question.subheader, languages)
        : true;
    let isValid = isHeadlineValid && isSubheaderValid;
    const defaultLanguageCode = "default";
    //question specific fields
    let fieldsToValidate = ["html", "buttonLabel", "upperLabel", "backButtonLabel", "lowerLabel"];

    // Remove backButtonLabel from validation if it is the first question
    if (isFirstQuestion) {
      fieldsToValidate = fieldsToValidate.filter((field) => field !== "backButtonLabel");
    }

    for (const field of fieldsToValidate) {
      if (question[field] && typeof question[field][defaultLanguageCode] !== "undefined") {
        isValid = isValid && isLabelValidForAllLanguages(question[field], languages);
      }
    }

    return isValid;
  },
};

// Main validation function
export const validateQuestion = (
  question: TSurveyQuestion,
  surveyLanguages: TSurveyLanguage[],
  isFirstQuestion: boolean
): boolean => {
  const specificValidation = validationRules[question.type];
  const defaultValidation = validationRules.defaultValidation;

  const specificValidationResult = specificValidation ? specificValidation(question, surveyLanguages) : true;
  const defaultValidationResult = defaultValidation(question, surveyLanguages, isFirstQuestion);

  // Return true only if both specific and default validation pass
  return specificValidationResult && defaultValidationResult;
};

export const validateSurveyQuestionsInBatch = (
  question: TSurveyQuestion,
  invalidQuestions: string[] | null,
  surveyLanguages: TSurveyLanguage[],
  isFirstQuestion: boolean
) => {
  if (invalidQuestions === null) {
    return [];
  }

  if (validateQuestion(question, surveyLanguages, isFirstQuestion)) {
    return invalidQuestions.filter((id) => id !== question.id);
  } else if (!invalidQuestions.includes(question.id)) {
    return [...invalidQuestions, question.id];
  }

  return invalidQuestions;
};

export const isCardValid = (
  card: TSurveyWelcomeCard | TSurveyThankYouCard,
  cardType: "start" | "end",
  surveyLanguages: TSurveyLanguage[]
): boolean => {
  const defaultLanguageCode = "default";
  const isContentValid = (content: Record<string, string> | undefined) => {
    return (
      !content || content[defaultLanguageCode] === "" || isLabelValidForAllLanguages(content, surveyLanguages)
    );
  };

  return (
    (card.headline ? isLabelValidForAllLanguages(card.headline, surveyLanguages) : true) &&
    isContentValid(
      cardType === "start" ? (card as TSurveyWelcomeCard).html : (card as TSurveyThankYouCard).subheader
    ) &&
    isContentValid(card.buttonLabel)
  );
};

export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (e) {
    return false;
  }
};

// Function to validate question ID and Hidden field Id
export const validateId = (
  type: "Hidden field" | "Question",
  field: string,
  existingQuestionIds: string[],
  existingHiddenFieldIds: string[]
): boolean => {
  if (field.trim() === "") {
    toast.error(`Please enter a ${type} Id.`);
    return false;
  }

  const combinedIds = [...existingQuestionIds, ...existingHiddenFieldIds];

  if (combinedIds.findIndex((id) => id.toLowerCase() === field.toLowerCase()) !== -1) {
    toast.error(`${type} Id already exists in questions or hidden fields.`);
    return false;
  }

  const forbiddenIds = [
    "userId",
    "source",
    "suid",
    "end",
    "start",
    "welcomeCard",
    "hidden",
    "verifiedEmail",
    "multiLanguage",
  ];
  if (forbiddenIds.includes(field)) {
    toast.error(`${type} Id not allowed.`);
    return false;
  }

  if (field.includes(" ")) {
    toast.error(`${type} Id not allowed, avoid using spaces.`);
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(field)) {
    toast.error(`${type} Id not allowed, use only alphanumeric characters, hyphens, or underscores.`);
    return false;
  }

  return true;
};

// Checks if there is a cycle present in the survey data logic.
export const isSurveyLogicCyclic = (questions: TSurveyQuestions) => {
  const visited: Record<string, boolean> = {};
  const recStack: Record<string, boolean> = {};

  const checkForCycle = (questionId: string) => {
    if (!visited[questionId]) {
      visited[questionId] = true;
      recStack[questionId] = true;

      const question = questions.find((question) => question.id === questionId);
      if (question && question.logic && question.logic.length > 0) {
        for (const logic of question.logic) {
          const destination = logic.destination;
          if (!destination) {
            return false;
          }

          if (!visited[destination] && checkForCycle(destination)) {
            return true;
          } else if (recStack[destination]) {
            return true;
          }
        }
      } else {
        // Handle default behavior
        const nextQuestionIndex = questions.findIndex((question) => question.id === questionId) + 1;
        const nextQuestion = questions[nextQuestionIndex];
        if (nextQuestion && !visited[nextQuestion.id] && checkForCycle(nextQuestion.id)) {
          return true;
        }
      }
    }

    recStack[questionId] = false;
    return false;
  };

  for (const question of questions) {
    const questionId = question.id;
    if (checkForCycle(questionId)) {
      return true;
    }
  }

  return false;
};
