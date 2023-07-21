import { UsersIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { NotificationSwitch } from "./NotificationSwitch";
import { Membership, User } from "./types";

interface EditAlertsProps {
  memberships: Membership[];
  user: User;
  environmentId: string;
}

export default function EditWeeklySummary({ memberships, user, environmentId }: EditAlertsProps) {
  return (
    <>
      {memberships.map((membership) => (
        <>
          <div className="mb-5 flex items-center space-x-3 font-semibold">
            <div className="rounded-full bg-slate-100 p-1">
              <UsersIcon className="h-6 w-7 text-slate-600" />
            </div>
            <p className="text-slate-800">{membership.team.name}</p>
          </div>
          <div className="mb-6 rounded-lg border border-slate-200">
            <div className="grid h-12 grid-cols-2 content-center rounded-t-lg bg-slate-100 px-4 text-left text-sm font-semibold text-slate-900">
              <div>Product</div>
              <div className="cursor-default pr-12 text-right">Weekly Summary</div>
            </div>
            <div className="grid-cols-8 space-y-1 p-2">
              {membership.team.products.map((product) => (
                <div
                  className="grid h-auto w-full cursor-pointer grid-cols-2 place-content-center rounded-lg px-2 py-2 text-left text-sm text-slate-900 hover:bg-slate-50"
                  key={product.id}>
                  <div>{product?.name}</div>
                  <div className="mr-20 flex justify-end">
                    <NotificationSwitch
                      surveyOrProductId={product.id}
                      userId={user.id}
                      notificationSettings={user.notificationSettings}
                      notificationType={"weeklySummary"}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="pb-3 pl-4 text-xs text-slate-400">
              Want to loop in team mates?{" "}
              <Link className="font-semibold" href={`/environments/${environmentId}/settings/members`}>
                Invite them.
              </Link>
            </p>
          </div>
        </>
      ))}
    </>
  );
}
