import React from "react";
import { CheckCircleIcon, PauseCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import footerLogo from "./footerlogo.svg";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@formbricks/ui";

const SurveyInactive = ({
  status,
  surveyClosedMessage,
}: {
  status: string;
  surveyClosedMessage?: { heading?: string | undefined; subheading?: string | undefined };
}) => {
  const icons = {
    "not found": <QuestionMarkCircleIcon className="h-20 w-20" />,
    paused: <PauseCircleIcon className="h-20 w-20" />,
    completed: <CheckCircleIcon className="h-20 w-20" />,
    "link invalid": <QuestionMarkCircleIcon className="h-20 w-20" />,
  };

  const descriptions = {
    "not found": "There is no survey with this ID.",
    paused: "This free & open-source survey is temporarily paused.",
    completed: "This free & open-source survey has been closed.",
    "link invalid": "This survey can only be taken by invitation.",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-tr from-slate-200 to-slate-50 py-8 text-center">
      <div></div>
      <div className="flex flex-col items-center space-y-3 text-slate-300">
        {icons[status]}
        <h1 className="text-4xl font-bold text-slate-800">
          {status === "completed" && surveyClosedMessage ? surveyClosedMessage.heading : `Survey ${status}.`}
        </h1>
        <p className="text-lg leading-10 text-gray-500">
          {status === "completed" && surveyClosedMessage
            ? surveyClosedMessage.subheading
            : descriptions[status]}
        </p>
        {!(status === "completed" && surveyClosedMessage) && status !== "link invalid" && (
          <Button variant="darkCTA" className="mt-2" href="https://formbricks.com">
            Create your own
          </Button>
        )}
      </div>
      <div>
        <Link href="https://formbricks.com">
          <Image src={footerLogo} alt="Brand logo" className="mx-auto w-40" />
        </Link>
      </div>
    </div>
  );
};

export default SurveyInactive;
