"use client";

import { Modal } from "../Modal";
import { Button } from "../Button";

interface DeleteDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  deleteWhat: string;
  onDelete: () => void;
  text?: string;
  isDeleting?: boolean;
  isSaving?: boolean;
  useSaveInsteadOfCancel?: boolean;
  onSave?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function DeleteDialog({
  open,
  setOpen,
  deleteWhat,
  onDelete,
  text,
  isDeleting,
  isSaving,
  useSaveInsteadOfCancel = false,
  onSave,
  children,
}: DeleteDialogProps) {
  return (
    <Modal open={open} setOpen={setOpen} title={`Delete ${deleteWhat}`}>
      <p>{text || "Are you sure? This action cannot be undone."}</p>
      <div>{children}</div>
      <div className="space-x-2 text-right">
        <Button
          loading={isSaving}
          variant="secondary"
          onClick={() => {
            if (useSaveInsteadOfCancel && onSave) {
              onSave();
            }
            setOpen(false);
          }}>
          {useSaveInsteadOfCancel ? "Save" : "Cancel"}
        </Button>
        <Button variant="warn" onClick={onDelete} loading={isDeleting}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
