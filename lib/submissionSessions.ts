import useSWR from "swr";
import { Schema, SubmissionSession, SubmissionSummary } from "./types";
import { fetcher } from "./utils";

export const useSubmissionSessions = (formId: string) => {
  const { data, error, mutate } = useSWR(
    () => `/api/forms/${formId}/submissionSessions`,
    fetcher
  );
  return {
    submissionSessions: data,
    isLoadingSubmissionSessions: !error && !data,
    isErrorSubmissionSessions: error,
    mutateSubmissionSessions: mutate,
  };
};

// fill the schema with the values provided by the user
export const getSubmission = (submissionSession, schema) => {
  if (!schema) return {};
  // create new submission
  const submission = {
    id: submissionSession.id,
    createdAt: submissionSession.createdAt,
    pages: [],
  };
  if (submissionSession.events.length > 0 && schema.pages) {
    // iterate through schema pages to fill submission
    for (const page of schema.pages) {
      // new submission page
      const submissionPage = {
        name: page.name,
        type: page.type,
        elements: page.elements
          ? JSON.parse(JSON.stringify(page.elements))
          : [],
      };
      // search for elements in schema pages of type "form" and fill their value into the submission
      if (page.type === "form") {
        const pageSubmission = submissionSession.events.find(
          (s) => s.type === "pageSubmission" && s.data?.pageName === page.name
        );
        if (typeof pageSubmission !== "undefined") {
          for (const [elementIdx, element] of page.elements.entries()) {
            if (element.type !== "submit") {
              if (element.name in pageSubmission.data?.submission) {
                submissionPage.elements[elementIdx].value =
                  pageSubmission.data.submission[element.name];
              }
            }
          }
        }
      }

      submission.pages.push(submissionPage);
    }
  }
  return submission;
};

export const getSubmissionAnalytics = (
  submissionSessions: SubmissionSession[],
  pages
) => {
  let totalSubmissions = 0;
  let lastSubmissionAt = null;
  let totalCandidateSubmited = [];
  let totalCandidateOpenedForm = [];
  let questionsInsights = [];
  for (const submissionSession of submissionSessions) {
    // collect unique users
    if (submissionSession.events.length > 0) {
      totalSubmissions += 1;
      const lastSubmission =
        submissionSession.events[submissionSession.events.length - 1];

      const submissionSessionsSubmitedType = submissionSession.events.filter(
        ({ data, type }) => type === "pageSubmission" && data.submission
      );

      pages.forEach(({ blocks }) => {
        // if (blocks.length > 1) {
        const pageName = blocks[0]?.data.text;
        // }
        blocks.forEach((question) => {
          if (
            submissionSessionsSubmitedType[0]?.data?.submission[question.id]
          ) {
            const isQuestionExist = questionsInsights.findIndex(
              (element) => element.id === question.id
            );
            let isCandidateExist = false;

            questionsInsights.map((element) => {
              const isExist = element.candidate.findIndex(
                (candidateId) =>
                  candidateId ===
                  submissionSessionsSubmitedType[0]?.data?.candidateId
              );
              isCandidateExist = isExist === -1 ? false : true;
            });

            if (isQuestionExist === -1) {
              if (question.type === "multipleChoiceQuestion") {
                const options = question.data.options.map(({ label }) => {
                  if (
                    submissionSessionsSubmitedType[0]?.data?.submission[
                      question.id
                    ] === label
                  ) {
                    return {
                      label,
                      candidates: 1,
                    };
                  } else {
                    return {
                      label,
                      candidates: 0,
                    };
                  }
                });
                questionsInsights.push({
                  candidate: [
                    submissionSessionsSubmitedType[0]?.data?.candidateId,
                  ],
                  id: question.id,
                  name: question.data.label,
                  stat: 1,
                  trend: undefined,
                  options,
                  pageName,
                });
              } else {
                questionsInsights.push({
                  candidate: [
                    submissionSessionsSubmitedType[0]?.data?.candidateId,
                  ],
                  id: question.id,
                  name: question.data.label,
                  stat: 1,
                  trend: undefined,
                  pageName,
                });
              }
            } else if (isQuestionExist !== -1 && !isCandidateExist) {
              const currentQuestion = questionsInsights.find(
                (element) => element.id === question.id
              );
              if (question.type === "multipleChoiceQuestion") {
                currentQuestion.options.map((option, index) => {
                  if (
                    "Option 3* : - Montant total à payer est de:  2 000$ - Paiements: paie 500$ pendant la période de formation. Paie le solde de $1500 à crédit grace à un pret bancaire remboursable en 24 mensualités dès la fin de la formation (soit 64$/mois durant 24 mois avec un taux d'intérêt réduit)" ===
                    submissionSessionsSubmitedType[0]?.data?.submission[
                      question.id
                    ]
                  ) {
                  }
                  if (
                    submissionSessionsSubmitedType[0]?.data?.submission[
                      question.id
                    ] === option.label
                  ) {
                    currentQuestion.options[index].candidates += 1;
                    currentQuestion.candidate.push(
                      submissionSessionsSubmitedType[0]?.data?.candidateId
                    );
                    currentQuestion.stat = currentQuestion.stat + 1;
                  }
                });
              }
            }
          }
        });
      });

      submissionSession.events.map(({ type, data }) => {
        if (type === "formOpened") {
          const isCandidateExist = totalCandidateOpenedForm.find(
            (id) => data.candidateId === id
          );
          if (!isCandidateExist) {
            totalCandidateOpenedForm.push(data.candidateId);
          }
        } else if (type === "pageSubmission") {
          const isCandidateExist = totalCandidateSubmited.find(
            (id) => data.candidateId === id
          );
          if (!isCandidateExist) {
            totalCandidateSubmited.push(data.candidateId);
          }
        }
      });
      if (!lastSubmissionAt) {
        lastSubmissionAt = lastSubmission.createdAt;
      } else if (
        Date.parse(lastSubmission.createdAt as string) >
        Date.parse(lastSubmissionAt)
      ) {
        lastSubmissionAt = lastSubmission.createdAt;
      }
    }
  }
  const pagesInsights = pages.map((page) => {
    if (page?.blocks[0]?.type === "header") {
      return {
        name: page.blocks[0].data.text,
        questions: [],
        id: `${page.blocks[0].data.text}-${page.blocks[0].data.level}`,
        stat: 0,
        trend: undefined,
        candidates: [],
        type: "page",
      };
    }
  });
  pagesInsights.splice(pagesInsights.length - 1, 1);
  questionsInsights.map((question) => {
    const ispageExist = pagesInsights.find(
      (page) => question.pageName === page.name
    );

    const pageIndex = pagesInsights.findIndex((element) => {
      return ispageExist.name === element.name;
    });
    pagesInsights[pageIndex].questions.push(question);
    question.candidate.map((candidateId) => {
      const candidateIndex = ispageExist.candidates.findIndex((element) => {
        return candidateId === element;
      });
      if (candidateIndex === -1) {
        pagesInsights[pageIndex].stat += 1;
        pagesInsights[pageIndex].candidates.push(candidateId);
      }
    });
  });

  return {
    lastSubmissionAt,
    totalCandidateSubmited: totalCandidateSubmited.length,
    totalCandidateOpenedForm: totalCandidateOpenedForm.length,
    totalSubmissions: totalSubmissions,
    pagesInsights,
  };
};

export const getSubmissionSummary = (
  submissionSessions: SubmissionSession[],
  schema: Schema
) => {
  if (!schema) return;
  const summary: SubmissionSummary = JSON.parse(JSON.stringify(schema));
  // iterate through SubmissionSessions and add values to summary
  for (const submissionSession of submissionSessions) {
    for (const submissionEvent of submissionSession.events) {
      if (submissionEvent.type === "pageSubmission" && summary.pages) {
        const summaryPage = summary.pages.find(
          (p) => p.name === submissionEvent.data.pageName
        );

        if (summaryPage && submissionEvent.data.submission) {
          for (const [elementName, elementValue] of Object.entries(
            submissionEvent.data.submission
          )) {
            const elementInSummary = summaryPage.elements.find(
              (e) => e.name === elementName
            );
            if (typeof elementInSummary !== "undefined") {
              if (
                [
                  "email",
                  "number",
                  "phone",
                  "text",
                  "textarea",
                  "website",
                ].includes(elementInSummary.type)
              ) {
                if (!("summary" in elementInSummary)) {
                  elementInSummary.summary = [];
                }
                elementInSummary.summary.push(elementValue);
              } else if (elementInSummary.type === "checkbox") {
                // checkbox values are a list of values
                for (const value of elementValue) {
                  const optionInSummary = elementInSummary.options.find(
                    (o) => o.value === value
                  );
                  if (typeof optionInSummary !== "undefined") {
                    if (!("summary" in optionInSummary)) {
                      optionInSummary.summary = 0;
                    }
                    optionInSummary.summary += 1;
                  }
                }
              } else if (elementInSummary.type === "radio") {
                const optionInSummary = elementInSummary.options.find(
                  (o) => o.value === elementValue
                );
                if (typeof optionInSummary !== "undefined") {
                  if (!("summary" in optionInSummary)) {
                    optionInSummary.summary = 0;
                  }
                  optionInSummary.summary += 1;
                }
              }
            }
          }
        }
      }
    }
  }
  return summary;
};
