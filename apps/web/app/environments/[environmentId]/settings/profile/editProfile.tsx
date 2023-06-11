"use client";

import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Modal from "@/components/shared/Modal";
import AvatarPlaceholder from "@/images/avatar-placeholder.png";
import { useProfileMutation } from "@/lib/profile/mutateProfile";
import { useProfile } from "@/lib/profile/profile";
import { deleteProfile } from "@/lib/users/users";
import { Button, ErrorComponent, Input, Label, ProfileAvatar } from "@formbricks/ui";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export function EditName() {
  const { register, handleSubmit } = useForm();
  const { profile, isLoadingProfile, isErrorProfile } = useProfile();

  const { triggerProfileMutate, isMutatingProfile } = useProfileMutation();

  if (isLoadingProfile) {
    return <LoadingSpinner />;
  }
  if (isErrorProfile) {
    return <ErrorComponent />;
  }

  return (
    <form
      className="w-full max-w-sm items-center"
      onSubmit={handleSubmit((data) => {
        triggerProfileMutate(data)
          .then(() => {
            toast.success("Your name was updated successfully.");
          })
          .catch((error) => {
            toast.error(`Error: ${error.message}`);
          });
      })}>
      <Label htmlFor="fullname">Full Name</Label>
      <Input type="text" id="fullname" defaultValue={profile.name} {...register("name")} />

      <div className="mt-4">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="fullname" defaultValue={profile.email} disabled />
      </div>
      <Button type="submit" variant="darkCTA" className="mt-4" loading={isMutatingProfile}>
        Update
      </Button>
    </form>
  );
}

export function EditAvatar({ session }) {
  return (
    <div>
      {session?.user?.image ? (
        <Image
          src={AvatarPlaceholder}
          width="100"
          height="100"
          className="h-24 w-24 rounded-full"
          alt="Avatar placeholder"
        />
      ) : (
        <ProfileAvatar userId={session?.user?.id} />
      )}

      <Button className="mt-4" variant="darkCTA" disabled={true}>
        Upload Image
      </Button>
    </div>
  );
}

interface DeleteAccounModaltProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

function DeleteAccountModal({ setOpen, open }: DeleteAccounModaltProps) {
  const deleteAccount = async () => {
    const res = await deleteProfile();
    console.log(res);
  };
  return (
    <Modal open={open} setOpen={setOpen}>
      <div>
        <h1 className="text-xl font-bold text-red-600">Delete Account Confirmation</h1>
        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
        <p>
          Deleting your account will permanently remove all your personal information, saved preferences, and
          activity history associated with this account. You will lose access to all your saved data,
          including messages, files, and any other content you have created or shared.
        </p>
        <p>
          Please consider the following before proceeding:
          <ol>
            <li>Your account and all associated data will be irreversibly deleted.</li>
            <li>
              You will lose access to all features and services tied to this account. Any subscriptions or
              memberships linked to this account will be canceled.
            </li>
            <li>
              You will need to create a new account if you wish to use our services again in the future.
            </li>
          </ol>
          <p>
            If you still wish to proceed with the account deletion, please enter your account password below
            and click the &quot;Delete Account&quot; button.
          </p>
          <Button className="mt-4" variant="warn" onClick={() => deleteAccount()}>
            Delete my account
          </Button>
        </p>
      </div>
    </Modal>
  );
}

export function DeleteAccount() {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <DeleteAccountModal open={isModalOpen} setOpen={setModalOpen} />
      <Button className="mt-4" variant="warn" onClick={() => setModalOpen(!isModalOpen)}>
        Delete my account
      </Button>
    </div>
  );
}
