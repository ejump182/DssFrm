export const revalidate = REVALIDATION_INTERVAL;

import EmptySpaceFiller from "@/components/shared/EmptySpaceFiller";
import { REVALIDATION_INTERVAL } from "@formbricks/lib/constants";
import { getAllUserSegments } from "@formbricks/lib/services/userSegment";
import { UserGroupIcon } from "@heroicons/react/20/solid";
import { format, formatDistanceToNow } from "date-fns";
import CreateSegmentModal from "@/app/(app)/environments/[environmentId]/(peopleAndSegments)/segments/CreateSegmentModal";

export default async function SegmentsPage({ params }) {
  const fetchedSegments = await getAllUserSegments(params.environmentId);

  if (!fetchedSegments) {
    throw new Error("Failed to fetch segments");
  }

  const segments = fetchedSegments.filter((segment) => !segment.isPrivate);
  return (
    <>
      <CreateSegmentModal environmentId={params.environmentId} />
      {segments.length === 0 ? (
        <EmptySpaceFiller
          type="table"
          environmentId={params.environmentId}
          emptyMessage="Your segments will appear here as soon as you add them ⏲️"
        />
      ) : (
        <>
          <div className="rounded-lg border border-slate-200">
            <div className="grid h-12 grid-cols-7 content-center rounded-lg bg-slate-100 text-left text-sm font-semibold text-slate-900">
              <div className="col-span-4 pl-6">Title</div>
              <div className="col-span-1 hidden text-center sm:block">Live Studies</div>
              <div className="col-span-1 hidden text-center sm:block">Updated</div>
              <div className="col-span-1 hidden text-center sm:block">Created</div>
            </div>
            {segments
              .filter((segment) => !segment.isPrivate)
              .map((segment) => (
                <div
                  key={segment.id}
                  className="m-2 grid h-16  grid-cols-7 content-center rounded-lg hover:bg-slate-100">
                  <div className="col-span-4 flex items-center pl-6 text-sm">
                    <div className="flex items-center gap-4">
                      <div className="ph-no-capture h-10 w-10 flex-shrink-0">
                        <UserGroupIcon />
                      </div>
                      <div className="flex flex-col">
                        <div className="ph-no-capture font-medium text-slate-900">{segment.title}</div>
                        <div className="ph-no-capture text-xs font-medium text-slate-500">
                          {segment.description}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 my-auto hidden whitespace-nowrap text-center text-sm text-slate-500 sm:block">
                    <div className="ph-no-capture font-medium text-slate-900">{segment.surveys?.length}</div>
                  </div>
                  <div className="col-span-1 my-auto hidden whitespace-nowrap text-center text-sm text-slate-500 sm:block">
                    <div className="ph-no-capture font-medium text-slate-900">
                      {formatDistanceToNow(segment.updatedAt, {
                        addSuffix: true,
                      }).replace("about", "")}
                    </div>
                  </div>
                  <div className="col-span-1 my-auto hidden whitespace-nowrap text-center text-sm text-slate-500 sm:block">
                    <div className="ph-no-capture font-medium text-slate-900">
                      {format(segment.createdAt, "do 'of' MMMM, yyyy")}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </>
  );
}
