import EmptyPageFiller from "@/components/shared/EmptyPageFiller";
import SurveyStatusIndicator from "@/components/shared/SurveyStatusIndicator";
import { timeSince } from "@/lib/time";
import { InboxIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function ResponseFeed({ person, sortByDate, environmentId }) {
  return (
    <>
      {person.responses.length === 0 ? (
        <EmptyPageFiller
          alertText="You haven't received any responses yet."
          hintText="Embed the widget on your website to start receiving feedback."
          borderStyles="border-4 border-dotted border-red">
          <InboxIcon className="stroke-thin mx-auto h-24 w-24 text-slate-300" />
        </EmptyPageFiller>
      ) : (
        <div>
          {person.responses
            .slice()
            .sort((a, b) =>
              sortByDate
                ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
            .map((response, responseIdx) => (
              <li key={response.createdAt} className="list-none">
                <div className="relative pb-8">
                  {responseIdx !== person.responses.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div className="w-full overflow-hidden rounded-lg bg-white shadow">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex w-full justify-between">
                          <div className="text-sm text-slate-400">
                            <time className="text-slate-700" dateTime={timeSince(response.createdAt)}>
                              {timeSince(response.createdAt)}
                            </time>
                          </div>
                          <div className="flex items-center justify-center space-x-2  rounded-full bg-slate-50 py-1 px-3 text-sm text-slate-600">
                            <Link
                              className="hover:underline"
                              href={`environments/${environmentId}/surveys/${response.survey.id}/summary`}>
                              {response.survey.name}
                            </Link>
                            <SurveyStatusIndicator status={response.survey.status} />
                          </div>
                        </div>
                        <div className="mt-3 space-y-3">
                          {response.survey.questions.map((question) => (
                            <div key={question.id} className="text-sm text-slate-500">
                              <p className="text-base font-semibold">{question.headline}</p>
                              <p className="my-1">{response.data[question.id]}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
        </div>
      )}
    </>
  );
}
