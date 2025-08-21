import type { ActionState } from "@/lib/error-handler";

type FieldErrorProps = {
  actionState: ActionState;
  name: string;
};

export default function FieldError({ actionState, name }: FieldErrorProps) {
  const message = actionState.fieldErrors[name]?.[0];

  if (!message) {return null;}

  return <span className="text-red-500 text-xs">{message}</span>;
};