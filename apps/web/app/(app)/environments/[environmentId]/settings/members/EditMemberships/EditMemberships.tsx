import { TTeam } from "@formbricks/types/v1/teams";
import React from "react";
import MembersInfo from "@/app/(app)/environments/[environmentId]/settings/members/EditMemberships/MembersInfo";
import {
  getAllMembershipsByUserId,
  getMembersByTeamId,
  getMembershipByUserId,
} from "@formbricks/lib/services/membership";
import { getInviteesByTeamId } from "@formbricks/lib/services/invite";
import TeamActions from "@/app/(app)/environments/[environmentId]/settings/members/EditMemberships/TeamActions";

type EditMembershipsProps = {
  team: TTeam;
  currentUserId: string;
};

export async function EditMemberships({ team, currentUserId }: EditMembershipsProps) {
  const members = await getMembersByTeamId(team.id);
  const invites = await getInviteesByTeamId(team.id);
  const membership = await getMembershipByUserId(currentUserId, team.id);

  const allMemberships = await getAllMembershipsByUserId(currentUserId);
  const isLeaveTeamDisabled = allMemberships.length <= 1;

  const currentUserRole = membership?.role;
  const isUserAdminOrOwner = membership?.role === "admin" || membership?.role === "owner";

  return (
    <div>
      {currentUserRole && (
        <TeamActions
          team={team}
          isAdminOrOwner={isUserAdminOrOwner}
          role={currentUserRole}
          isLeaveTeamDisabled={isLeaveTeamDisabled}
        />
      )}

      <div className="rounded-lg border border-slate-200">
        <div className="grid-cols-20 grid h-12 content-center rounded-t-lg bg-slate-100 text-left text-sm font-semibold text-slate-900">
          <div className="col-span-2"></div>
          <div className="col-span-5">Fullname</div>
          <div className="col-span-5">Email</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-5"></div>
        </div>

        {currentUserRole && (
          <MembersInfo
            team={team}
            currentUserId={currentUserId}
            invites={invites ?? []}
            members={members ?? []}
            isUserAdminOrOwner={isUserAdminOrOwner}
            currentUserRole={currentUserRole}
          />
        )}
      </div>
    </div>
  );
}
