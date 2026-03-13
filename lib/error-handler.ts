import { ZodError } from 'zod';

export type ActionState = {
  status: 'success' | 'error' | '';
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
};

export const EMPTY_ACTION_STATE: ActionState = {
  status: '',
  message: "",
  fieldErrors: {},
};

export const fromErrorToActionState = (error: unknown): ActionState => {
  if (error instanceof ZodError) {
    return {
      status: 'error',
      message: "",
      fieldErrors: error.flatten().fieldErrors,
    };
  } else if (error instanceof Error) {
    return {
      status: 'error',
      message: error.message,
      fieldErrors: {},
    };
  } else {
    return {
      status: 'error',
      message: "An unknown error occurred",
      fieldErrors: {},
    };
  }
};

export const toActionState = (message: string): ActionState => ({
  status: 'success',
  message,
  fieldErrors: {},
});

/**
 * Strip the numeric prefix added by React's useActionState
 * (e.g., "1_order_number" -> "order_number", pure index keys like "0" are skipped)
 */
export const cleanFormData = (formData: FormData): Record<string, FormDataEntryValue> => {
  const raw = Object.fromEntries(formData);
  const cleaned: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.match(/^\d+$/)) continue;
    const cleanKey = key.match(/^\d+_/) ? key.substring(key.indexOf('_') + 1) : key;
    if (cleanKey) cleaned[cleanKey] = value;
  }
  return cleaned;
};