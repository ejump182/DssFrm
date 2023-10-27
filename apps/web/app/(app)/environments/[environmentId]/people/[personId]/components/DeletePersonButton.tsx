"use client";

import { deletePersonAction } from "@/app/(app)/environments/[environmentId]/people/[personId]/actions";
import { getAccessFlags } from "@formbricks/lib/membership/utils";
import { TMembershipRole } from "@formbricks/types/memberships";
import { DeleteDialog } from "@formbricks/ui/DeleteDialog";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface DeletePersonButtonProps {
  environmentId: string;
  personId: string;
  membershipRole?: TMembershipRole;
}

export function DeletePersonButton({ environmentId, personId, membershipRole }: DeletePersonButtonProps) {
  const router = useRouter();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingPerson, setIsDeletingPerson] = useState(false);
  const { isViewer } = getAccessFlags(membershipRole);

  const handleDeletePerson = async () => {
    try {
      if (isViewer) {
        throw new Error("You are not authorized to perform this action");
      }
      setIsDeletingPerson(true);
      await deletePersonAction(personId);
      router.refresh();
      router.push(`/environments/${environmentId}/people`);
      toast.success("Person deleted successfully.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeletingPerson(false);
    }
  };
  return (
    <>
      <button
        onClick={() => {
          setDeleteDialogOpen(true);
        }}>
        <TrashIcon className="h-5 w-5 text-slate-500 hover:text-red-700" />
      </button>
      <DeleteDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        deleteWhat="person"
        onDelete={handleDeletePerson}
        isDeleting={isDeletingPerson}
      />
    </>
  );
}
