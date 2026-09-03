import type { ReactNode } from 'react';

import FieldError from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import type { ActionState } from '@/lib/error-handler';

interface NativeSelectFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  actionState: ActionState;
  children: ReactNode;
}

// Shared "label + native <select> + field error" block, for the plain
// `<select>` fields that don't use the shadcn Select primitive.
export function NativeSelectField({ name, label, value, onChange, disabled, actionState, children }: NativeSelectFieldProps) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <select
        aria-describedby={`${name}-error`}
        aria-invalid={!!actionState.fieldErrors?.[name]}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <FieldError actionState={actionState} name={name} />
    </div>
  );
}
