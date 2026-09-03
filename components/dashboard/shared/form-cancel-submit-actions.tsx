import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface FormCancelSubmitActionsProps {
  onCancel?: () => void;
  cancelHref: string;
  pending: boolean;
  isEditing: boolean;
  cancelLabel: string;
  updateLabel: string;
  createLabel: string;
}

// Shared "cancel (button or link) + submit" action row, repeated across
// entity forms.
export function FormCancelSubmitActions({
  onCancel,
  cancelHref,
  pending,
  isEditing,
  cancelLabel,
  updateLabel,
  createLabel,
}: FormCancelSubmitActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {onCancel ? (
        <Button type="button" variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
      ) : (
        <Button asChild type="button" variant="secondary">
          <Link href={cancelHref}>{cancelLabel}</Link>
        </Button>
      )}
      <Button disabled={pending} type="submit">
        {isEditing ? updateLabel : createLabel}
      </Button>
    </div>
  );
}
