"use client";

import React, { useReducer } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { sendContactEmail } from "@/actions/contact/send-contact-email";
import { trackEvent } from "@/lib/track-event";
import type { ContactFormValues } from "@/schemas/contact.schema";
import { ContactSchema, contactFieldSchemas } from "@/schemas/contact.schema";

type ValidatableField = keyof typeof contactFieldSchemas;

const INITIAL_FORM: ContactFormValues = {
  name: "",
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
  { name: "name", type: "text", autoComplete: "name", required: true },
  { name: "email", type: "email", autoComplete: "email", required: true },
  { name: "phoneNumber", type: "tel", autoComplete: "tel", required: false },
  { name: "business", type: "text", autoComplete: "organization", required: false },
] as const;

const INPUT =
  "mt-2.5 w-full rounded-xl border border-[#d5d5dd] bg-white px-4 text-base text-sitio-ink shadow-[inset_0_1px_2px_rgba(22,22,63,0.06)] outline-none transition-shadow placeholder:text-[#8d8d9e] focus:border-sitio-blue focus:ring-2 focus:ring-sitio-blue/20";

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

    // Opcionales vacíos → undefined; honeyField lo descarta el schema.
    const result = ContactSchema.safeParse({
      ...formValues,
      phoneNumber: formValues.phoneNumber || undefined,
      business: formValues.business || undefined,
    });

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

  // "Nombre y apellido *" / "Teléfono (opcional)", como en el mockup.
  const label = (name: keyof ContactFormValues, required: boolean) => (
    <>
      {t(name === "phoneNumber" ? "phone" : name)}{" "}
      {required ? <span className="text-sitio-pink">*</span> : <span className="text-[#8d8d9e]">{t("optional")}</span>}
    </>
  );

  return (
    <form method="post" onSubmit={handleSubmit} noValidate className="grid gap-6 sm:grid-cols-2">
      {FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col text-[1.1rem] leading-tight">
          <span>{label(f.name, f.required)}</span>
          <input
            type={f.type}
            name={f.name}
            autoComplete={f.autoComplete}
            value={formValues[f.name]}
            onChange={updateField}
            onBlur={updateField}
            readOnly={loading}
            aria-required={f.required}
            aria-invalid={!!errors[f.name]}
            aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
            className={`${INPUT} h-[3.1rem]`}
          />
          {errors[f.name] && <span id={`${f.name}-error`} className="mt-1.5 text-sm text-[#e0002e]">{errors[f.name]}</span>}
        </label>
      ))}
      <label className="flex flex-col text-[1.1rem] leading-tight sm:col-span-2">
        <span>{label("message", true)}</span>
        <textarea
          name="message"
          rows={5}
          placeholder={t("messagePlaceholder")}
          value={formValues.message}
          onChange={updateField}
          onBlur={updateField}
          readOnly={loading}
          aria-required
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`${INPUT} h-40 py-3.5 text-[1.05rem]`}
        />
        {errors.message && <span id="message-error" className="mt-1.5 text-sm text-[#e0002e]">{errors.message}</span>}
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
        className="mt-2 inline-flex h-[3.7rem] cursor-pointer items-center justify-center gap-4 rounded-full bg-sitio-blue px-10 text-[1.4rem] font-bold text-white shadow-[0_8px_20px_-8px_rgba(0,98,254,0.7)] transition-colors hover:bg-[#0052d6] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
      >
        {loading ? t("loading") : t("submit")}
        <ArrowRight className="size-6" strokeWidth={2.5} aria-hidden />
      </button>
    </form>
  );
}
