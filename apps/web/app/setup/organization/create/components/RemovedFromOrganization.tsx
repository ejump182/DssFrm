"use client";

import { formbricksLogout } from "@/app/lib/formbricks";
import { Session } from "next-auth";
import React, { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@formbricks/ui/Alert";
import { Button } from "@formbricks/ui/Button";
import { DeleteAccountModal } from "@formbricks/ui/DeleteAccountModal";

interface RemovedFromOrganizationProps {
  session: Session;
  IS_FORMBRICKS_CLOUD: boolean;
}

export const RemovedFromOrganization = ({ session, IS_FORMBRICKS_CLOUD }: RemovedFromOrganizationProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="space-y-4">
      <Alert variant="info">
        <AlertTitle>No organization found!</AlertTitle>
        <AlertDescription>
          Unfortunately, you have been removed from the organization. If you believe this was a mistake,
          please reach out to the organization owner.
        </AlertDescription>
      </Alert>
      <DeleteAccountModal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        session={session}
        IS_FORMBRICKS_CLOUD={IS_FORMBRICKS_CLOUD}
        formbricksLogout={formbricksLogout}
      />
      <Button variant="darkCTA" onClick={() => setIsModalOpen(true)}>
        Delete account
      </Button>
    </div>
  );
};
