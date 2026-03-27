"use client";

import React, { useReducer } from "react";
import type { MutableRefObject } from "react";
import {
  InputField,
  InputTextArea,
  PhoneNumberField,
} from "@/components/landing/components/input-field";
import type { ContactFormValues } from "@/schemas/contact.schema";
import { ContactSchema, contactFieldSchemas } from "@/schemas/contact.schema";
import { sendContactEmail } from "@/actions/contact/send-contact-email";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
  | { type: "SUBMIT_ERROR"; message: string }
  | { type: "SUBMIT_END" };

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
      return { ...state, success: action.message, formValues: INITIAL_FORM, errors: {} };
    case "SUBMIT_ERROR":
      return { ...state, error: action.message };
    case "SUBMIT_END":
      return { ...state, loading: false };
  }
}

const ContactForm = ({
  circleRefs,
}: {
  circleRefs: MutableRefObject<(HTMLDivElement | null)[]>;
}) => {
  const t = useTranslations("Landing.contact");

  const [state, dispatch] = useReducer(formReducer, initialState);
  const { formValues, errors, success, error, loading } = state;

  const validateField = (name: string, value: string): string | undefined => {
    if (!(name in contactFieldSchemas)) return undefined;

    const schema = contactFieldSchemas[name as ValidatableField];
    const fieldResult = schema.safeParse(value);

    if (!fieldResult.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return t(fieldResult.error.issues[0].message as any);
    }
    return undefined;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    dispatch({ type: "SET_FIELD", name: name as keyof ContactFormValues, value });
    dispatch({ type: "SET_FIELD_ERROR", name: name as keyof ContactFormValues, message: validateField(name, value) });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    dispatch({ type: "SET_FIELD", name: "phoneNumber", value });
    dispatch({ type: "SET_FIELD_ERROR", name: "phoneNumber", message: validateField("phoneNumber", value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formValues.honeyField) return;

    const result = ContactSchema.safeParse({
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      phoneNumber: formValues.phoneNumber,
      business: formValues.business || undefined, // empty string → undefined (optional field)
      message: formValues.message,
    });

    if (!result.success) {
      const newErrors: Partial<ContactFormValues> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ContactFormValues;
        if (!newErrors[field]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newErrors[field] = t(issue.message as any);
        }
      }
      dispatch({ type: "SET_ERRORS", errors: newErrors });
      return;
    }

    dispatch({ type: "SUBMIT_START" });

    const emailResult = await sendContactEmail(result.data);

    if (emailResult.success) {
      dispatch({ type: "SUBMIT_SUCCESS", message: t("success") });
    } else {
      dispatch({ type: "SUBMIT_ERROR", message: t("error") });
    }

    dispatch({ type: "SUBMIT_END" });
  };

  return (
    <div
      id="contact-form"
      className="flex flex-col w-full items-center pt-5 gap-6 overflow-x-hidden"
    >
      <div className="flex flex-col w-[90%] md:w-[82%] lg:w-[65%] gap-2 justify-center">
        <div className="flex flex-col justify-center gap-3">
          <h2 className="font-normal text-4xl sm:text-5xl md:text-6xl lg:text-6xl text-center md:text-start">
            {t("title")}
          </h2>
          <p className="font-light text-base lg:text-lg text-center md:text-start">
            {t("subtitle")}
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 w-[85%] md:w-full md:grid-cols-2 gap-7 mx-auto py-10 rounded-lg"
        >
          <InputField
            name="firstName"
            value={formValues.firstName}
            label={t("firstName")}
            color="#FF4573"
            errors={errors}
            onChange={handleChange}
            circleRefs={circleRefs}
            index={0}
          />
          <InputField
            name="lastName"
            value={formValues.lastName}
            label={t("lastName")}
            color="#31A1D6"
            errors={errors}
            onChange={handleChange}
            circleRefs={circleRefs}
            index={1}
          />
          <InputField
            name="email"
            value={formValues.email}
            label={t("email")}
            color="#FD7E14"
            errors={errors}
            onChange={handleChange}
            circleRefs={circleRefs}
            index={2}
          />
          <PhoneNumberField
            label={t("phone")}
            value={formValues.phoneNumber}
            errors={errors}
            onChange={handlePhoneChange}
            circleRefs={circleRefs}
            index={3}
          />
          <InputField
            name="business"
            value={formValues.business}
            label={t("business")}
            color="#31A1D6"
            errors={errors}
            onChange={handleChange}
            circleRefs={circleRefs}
            index={4}
            colSpanMd={2}
          />
          <InputTextArea
            name="message"
            value={formValues.message}
            label={t("message")}
            color="#FD7E14"
            errors={errors}
            onChange={handleChange}
            circleRefs={circleRefs}
            index={5}
          />
          {/* Honeypot */}
          <div
            className="absolute opacity-0 left-[-9999px] pointer-events-none"
            aria-hidden="true"
          >
            <input
              type="text"
              name="honeyField"
              id="honeyField"
              value={formValues.honeyField}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <input type="hidden" name="honeyField" value="" />
          {(!!success || !!error) && (
            <div className="flex flex-col col-span-1 md:col-span-2 -mt-4">
              {!!success && (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-5 w-5"
                    style={{ color: "#4BB562" }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p style={{ color: "#4BB562" }}>{success}</p>
                </div>
              )}
              {!!error && (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-5 w-5"
                    style={{ color: "#FF0000" }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p style={{ color: "#FF0000" }}>{error}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col md:flex-row col-span-1 md:col-span-2 justify-around items-center gap-4">
            <button
              type="submit"
              className={`text-white px-8 py-4 rounded-full ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ backgroundColor: "#FD7E14" }}
              disabled={loading}
            >
              {loading && (
                <div
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white mr-2"
                  role="status"
                >
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                    {t("loading")}
                  </span>
                </div>
              )}
              {t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
