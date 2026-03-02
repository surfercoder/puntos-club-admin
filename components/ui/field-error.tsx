import type { ActionState } from "@/lib/error-handler";

type FieldErrorProps = {
  actionState: ActionState;
  name: string;
};

export default function FieldError({ actionState, name }: FieldErrorProps) {
  const message = actionState.fieldErrors[name]?.[0];

  if (!message) {return null;}

  return (
    <p id={`${name}-error`} className="text-destructive text-sm">
      {message}
    </p>
  );
};