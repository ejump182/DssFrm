"use client";

import { useForm } from "react-hook-form";

import { AddMemberRole } from "@formbricks/ee/RoleManagement/components/AddMemberRole";
import { Button } from "@formbricks/ui/Button";
import { Input } from "@formbricks/ui/Input";
import { Label } from "@formbricks/ui/Label";
import { UpgradePlanNotice } from "@formbricks/ui/UpgradePlanNotice";

enum MembershipRole {
  Admin = "admin",
  Editor = "editor",
  Developer = "developer",
  Viewer = "viewer",
}

interface MemberModalProps {
  setOpen: (v: boolean) => void;
  onSubmit: (data: { name: string; email: string; role: MembershipRole }[]) => void;
  canDoRoleManagement: boolean;
  isFormbricksCloud: boolean;
  environmentId: string;
}
export default function IndividualInviteTab({
  setOpen,
  onSubmit,
  canDoRoleManagement,
  isFormbricksCloud,
  environmentId,
}: MemberModalProps) {
  const { register, getValues, handleSubmit, reset, control } = useForm<{
    name: string;
    email: string;
    role: MembershipRole;
  }>();

  const submitEventClass = async () => {
    const data = getValues();
    data.role = data.role || MembershipRole.Admin;
    onSubmit([data]);
    setOpen(false);
    reset();
  };
  return (
    <form onSubmit={handleSubmit(submitEventClass)}>
      <div className="flex justify-between rounded-lg p-6">
        <div className="w-full space-y-4">
          <div>
            <Label htmlFor="memberNameInput">Full Name</Label>
            <Input
              id="memberNameInput"
              placeholder="e.g. Hans Wurst"
              {...register("name", { required: true, validate: (value) => value.trim() !== "" })}
            />
          </div>
          <div>
            <Label htmlFor="memberEmailInput">Email Address</Label>
            <Input
              id="memberEmailInput"
              type="email"
              placeholder="hans@wurst.com"
              {...register("email", { required: true })}
            />
          </div>
          <div>
            <AddMemberRole control={control} canDoRoleManagement={canDoRoleManagement} />
            {!canDoRoleManagement &&
              (isFormbricksCloud ? (
                <UpgradePlanNotice
                  message="To manage access roles,"
                  url={`/environments/${environmentId}/settings/billing`}
                  textForUrl="please add your credit card (free)."
                />
              ) : (
                <UpgradePlanNotice
                  message="To manage access roles for your team,"
                  url="https://formbricks.com/docs/self-hosting/enterprise"
                  textForUrl="get a enterprise license."
                />
              ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end p-6">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="minimal"
            onClick={() => {
              setOpen(false);
            }}>
            Cancel
          </Button>
          <Button variant="darkCTA" type="submit">
            Send Invitation
          </Button>
        </div>
      </div>
    </form>
  );
}
