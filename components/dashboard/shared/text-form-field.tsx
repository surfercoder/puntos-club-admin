import { Input } from '@/components/ui/input';
import FieldError from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import type { ActionState } from '@/lib/error-handler';

interface TextFormFieldProps {
  name: string;
  label: string;
  defaultValue?: string | number;
  placeholder?: string;
  actionState: ActionState;
  type?: string;
  step?: string;
}

// Shared "label + text input + field error" block, repeated across the
// simpler entity forms.
export function TextFormField({ name, label, defaultValue = '', placeholder, actionState, type = 'text', step }: TextFormFieldProps) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        aria-describedby={`${name}-error`}
        aria-invalid={!!actionState.fieldErrors?.[name]}
        defaultValue={defaultValue}
        id={name}
        name={name}
        placeholder={placeholder}
        step={step}
        type={type}
      />
      <FieldError actionState={actionState} name={name} />
    </div>
  );
}
