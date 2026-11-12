"use client";

import React, { useReducer } from "react";
import { useTranslations } from "next-intl";

import { sendContactEmail } from "@/actions/contact/send-contact-email";
import { trackEvent } from "@/lib/track-event";
import type { ContactFormValues } from "@/schemas/contact.schema";
import { ContactSchema, contactFieldSchemas } from "@/schemas/contact.schema";

type ValidatableField = keyof typeof contactFieldSchemas;

const INITIAL_FORM: ContactFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  business: "",
  message: "",
  honeyField: "",
};

type FormState = {
  formValues: ContactFormValues;
  errors: Partial<ContactFormValues>;
  success: string;
  error: string;
  loading: boolean;
};

type FormAction =
  | { type: "SET_FIELD"; name: keyof ContactFormValues; value: string }
  | { type: "SET_ERRORS"; errors: Partial<ContactFormValues> }
  | { type: "SET_FIELD_ERROR"; name: keyof ContactFormValues; message: string | undefined }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; message: string }
  | { type: "SUBMIT_ERROR"; message: string };

const initialState: FormState = {
  formValues: INITIAL_FORM,
  errors: {},
  success: "",
  error: "",
  loading: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, formValues: { ...state.formValues, [action.name]: action.value } };
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    case "SET_FIELD_ERROR": {
      const next = { ...state.errors };
      if (action.message) {
        next[action.name] = action.message;
      } else {
        delete next[action.name];
      }
      return { ...state, errors: next };
    }
    case "SUBMIT_START":
      return { ...state, loading: true, success: "", error: "" };
    case "SUBMIT_SUCCESS":
      return { ...state, loading: false, success: action.message, formValues: INITIAL_FORM, errors: {} };
    case "SUBMIT_ERROR":
      return { ...state, loading: false, error: action.message };
  }
}

const FIELDS = [
  { name: "firstName", type: "text", autoComplete: "given-name" },
  { name: "lastName", type: "text", autoComplete: "family-name" },
  { name: "email", type: "email", autoComplete: "email" },
  { name: "phoneNumber", type: "tel", autoComplete: "tel" },
  { name: "business", type: "text", autoComplete: "organization", wide: true },
] as const;

const INPUT =
  "w-full rounded-xl border border-[#e7dbe3] bg-white px-4 py-3 text-sitio-ink outline-none transition-shadow focus:border-sitio-blue focus:ring-2 focus:ring-sitio-blue/20";

export function ContactForm() {
  const t = useTranslations("Site.contact");

  // Las claves salen de los mensajes del schema (validation.*), que viven en Site.contact.
  const tKey = (key: string) => t(key as Parameters<typeof t>[0]);

  const [state, dispatch] = useReducer(formReducer, initialState);
  const { formValues, errors, success, error, loading } = state;

  const validateField = (name: string, value: string): string | undefined => {
    if (!(name in contactFieldSchemas)) return undefined;

    const schema = contactFieldSchemas[name as ValidatableField];
    const fieldResult = schema.safeParse(value);

    if (!fieldResult.success) {
      return tKey(fieldResult.error.issues[0].message);
    }
    return undefined;
  };

  const updateField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    // Como el Input del dashboard: el email siempre en minúscula.
    const value = name === "email" ? e.target.value.toLowerCase() : e.target.value;
    dispatch({ type: "SET_FIELD", name: name as keyof ContactFormValues, value });
    dispatch({ type: "SET_FIELD_ERROR", name: name as keyof ContactFormValues, message: validateField(name, value) });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formValues.honeyField) return;

    // business vacío → undefined (opcional); honeyField lo descarta el schema.
    const result = ContactSchema.safeParse({ ...formValues, business: formValues.business || undefined });

    if (!result.success) {
      const newErrors: Partial<ContactFormValues> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ContactFormValues;
        if (!newErrors[field]) {
          newErrors[field] = tKey(issue.message);
        }
      }
      dispatch({ type: "SET_ERRORS", errors: newErrors });
      // El foco en el primer campo inválido hace que el lector de pantalla lea su error.
      e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(newErrors)[0]}"]`)?.focus();
      return;
    }

    dispatch({ type: "SUBMIT_START" });

    // Si el request ni llega al server, la action no puede atrapar el error.
    const emailResult = await sendContactEmail(result.data).catch(() => ({ success: false }));

    if (emailResult.success) {
      // Conversion "formulario enviado" en GA4.
      trackEvent("generate_lead");
      dispatch({ type: "SUBMIT_SUCCESS", message: t("success") });
    } else {
      dispatch({ type: "SUBMIT_ERROR", message: t("error") });
    }
  };

  const label = (name: keyof ContactFormValues) => t(name === "phoneNumber" ? "phone" : name);

  return (
    <form method="post" onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      {FIELDS.map((f) => (
        <label key={f.name} className={`flex flex-col gap-1.5 text-sm font-medium ${"wide" in f ? "sm:col-span-2" : ""}`}>
          {label(f.name)}
          <input
            type={f.type}
            name={f.name}
            autoComplete={f.autoComplete}
            value={formValues[f.name]}
            onChange={updateField}
            onBlur={updateField}
            readOnly={loading}
            aria-invalid={!!errors[f.name]}
            aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
            className={INPUT}
          />
          {errors[f.name] && <span id={`${f.name}-error`} className="text-sm font-normal text-[#e0002e]">{errors[f.name]}</span>}
        </label>
      ))}
      <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
        {t("message")}
        <textarea
          name="message"
          rows={5}
          value={formValues.message}
          onChange={updateField}
          onBlur={updateField}
          readOnly={loading}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={INPUT}
        />
        {errors.message && <span id="message-error" className="text-sm font-normal text-[#e0002e]">{errors.message}</span>}
      </label>
      {/* Honeypot */}
      <input
        aria-hidden="true"
        aria-label="honeypot"
        type="text"
        name="honeyField"
        value={formValues.honeyField}
        onChange={updateField}
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] opacity-0"
      />
      {success && <p className="font-medium text-[#0a9d47] sm:col-span-2" role="status">{success}</p>}
      {error && <p className="font-medium text-[#e0002e] sm:col-span-2" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-13 cursor-pointer items-center justify-center rounded-full bg-sitio-blue px-8 text-lg font-semibold text-white transition-colors hover:bg-[#0052d6] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
      >
        {loading ? t("loading") : t("submit")}
      </button>
    </form>
  );
}
