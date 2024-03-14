// https://github.com/airbnb/javascript/#naming--uppercase

export const COLOR_DEFAULTS = {
  brandColor: "#64748b",
  questionColor: "#2b2524",
  inputColor: "#ffffff",
  inputBorderColor: "#cbd5e1",
  cardBackgroundColor: "#ffffff",
  cardBorderColor: "#e2e8f0",
  cardShadowColor: "#000000",
  highlightBorderColor: "#64748b",
} as const;

export const PREVIEW_SURVEY = {
  id: "mppwcoocbqln3kvhbe3wqp4j",
  createdAt: new Date(),
  updatedAt: new Date(),
  name: "Product Market Fit (Superhuman)",
  type: "link",
  environmentId: "cfor1u7eyy9oxj15x0yzkwdz",
  createdBy: "m1tcr30g782beafghnuen30i",
  status: "draft",
  welcomeCard: {
    html: "Thanks for providing your feedback - let's go!",
    enabled: false,
    headline: "Welcome!",
    timeToFinish: true,
    showResponseCount: false,
  },
  questions: [
    {
      id: "xpjmvmdw5x5pv1jpkq5w2prd",
      type: "openText",
      headline: "This is a preview survey",
      required: true,
      inputType: "text",
      subheader: "Click through it to check the look and feel of the surveying experience.",
      longAnswer: true,
      placeholder: "Type your answer here...",
    },
    {
      id: "swfnndfht0ubsu9uh17tjcej",
      type: "rating",
      range: 5,
      scale: "star",
      headline: "How would you rate My Product",
      required: true,
      subheader: "Don't worry, be honest.",
      lowerLabel: "Not good",
      upperLabel: "Very good",
    },
    {
      id: "je70a714xjdxc70jhxgv5web",
      type: "multipleChoiceSingle",
      choices: [
        {
          id: "vx9q4mlr6ffaw35m99bselwm",
          label: "Eat the cake 🍰",
        },
        {
          id: "ynj051qawxd4dszxkbvahoe5",
          label: "Have the cake 🎂",
        },
      ],
      headline: "What do you do?",
      required: true,
      subheader: "Can't do both.",
      shuffleOption: "none",
    },
  ],
  thankYouCard: {
    enabled: true,
    headline: "Thank you!",
    subheader: "We appreciate your feedback.",
  },
  hiddenFields: {
    enabled: true,
    fieldIds: [],
  },
  displayOption: "displayOnce",
  recontactDays: null,
  autoClose: null,
  closeOnDate: null,
  delay: 0,
  displayPercentage: null,
  autoComplete: null,
  verifyEmail: null,
  redirectUrl: null,
  productOverwrites: null,
  styling: {},
  surveyClosedMessage: null,
  singleUse: {
    enabled: false,
    isEncrypted: true,
  },
  pin: null,
  resultShareKey: null,
  triggers: [],
  inlineTriggers: null,
  segment: null,
};
