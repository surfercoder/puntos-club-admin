import FieldError from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState } from '@/lib/error-handler';

interface OrganizationTextareaFieldProps {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  actionState: ActionState;
  rows?: number;
}

// Shared "label + textarea + field error" block.
export function OrganizationTextareaField({ name, label, defaultValue = '', placeholder, actionState, rows }: OrganizationTextareaFieldProps) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        aria-describedby={`${name}-error`}
        aria-invalid={!!actionState.fieldErrors?.[name]}
        defaultValue={defaultValue}
        id={name}
        name={name}
        placeholder={placeholder}
        rows={rows}
      />
      <FieldError actionState={actionState} name={name} />
    </div>
  );
}
