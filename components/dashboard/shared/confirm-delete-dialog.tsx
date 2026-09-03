'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title: ReactNode;
  description: ReactNode;
  isDeleting: boolean;
  onConfirm: () => void;
  cancelLabel: ReactNode;
  confirmLabel: ReactNode;
  cancelVariant?: 'outline' | 'secondary';
  buttonType?: 'button';
  footerClassName?: string;
}

// Shared shell for the ~16 near-identical entity delete confirmation dialogs.
// Callers keep their own delete action, translations and error handling.
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  isDeleting,
  onConfirm,
  cancelLabel,
  confirmLabel,
  cancelVariant = 'outline',
  buttonType,
  footerClassName,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className={footerClassName}>
          <Button
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            type={buttonType}
            variant={cancelVariant}
          >
            {cancelLabel}
          </Button>
          <Button disabled={isDeleting} onClick={onConfirm} type={buttonType} variant="destructive">
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
