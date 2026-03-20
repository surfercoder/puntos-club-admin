"use client";

import React, { useState } from "react";
import type { MutableRefObject } from "react";
import {
  InputField,
  InputTextArea,
  PhoneNumberField,
} from "@/components/landing/components/input-field";
import type { ContactFormValues } from "@/components/landing/components/input-field";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ContactForm = ({
  circleRefs,
}: {
  circleRefs: MutableRefObject<(HTMLDivElement | null)[]>;
}) => {
  const t = useTranslations("Landing.contact");

  const [formValues, setFormValues] = useState<ContactFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    business: "",
    message: "",
    honeyField: "",
  });

  const [errors, setErrors] = useState<Partial<ContactFormValues>>({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
    validateForm(e.target.value, e.target.name);
  };

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormValues({
      ...formValues,
      phoneNumber: e.target.value,
    });
    validateForm(e.target.value, "phoneNumber");
  };

  const validateForm = (value: string, name: string) => {
    const newErrors: Partial<ContactFormValues> = { ...errors };
    delete newErrors[name as keyof ContactFormValues];

    switch (name) {
      case "firstName": {
        if (value.trim() === "") {
          newErrors.firstName = t("validation.firstNameRequired");
          break;
        }
        if (value.length < 2) {
          newErrors.firstName = t("validation.firstNameMinLength");
          break;
        }
        break;
      }
      case "lastName": {
        if (value.trim() === "") {
          newErrors.lastName = t("validation.lastNameRequired");
          break;
        }
        if (value.length < 2) {
          newErrors.lastName = t("validation.lastNameMinLength");
          break;
        }
        break;
      }
      case "email": {
        if (value.trim() === "") {
          newErrors.email = t("validation.emailRequired");
          break;
        }
        if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = t("validation.emailInvalid");
          break;
        }
        break;
      }
      case "phoneNumber": {
        if (value.trim() === "") {
          newErrors.phoneNumber = t("validation.phoneRequired");
          break;
        }
        if (!/^[^a-zA-Z]*$/.test(value)) {
          newErrors.phoneNumber = t("validation.phoneNoLetters");
          break;
        }
        if (value.length < 10) {
          newErrors.phoneNumber = t("validation.phoneMinLength");
          break;
        }
        break;
      }
      case "business": {
        if (value.trim() === "") {
          newErrors.business = t("validation.businessRequired");
          break;
        }
        if (value.length < 4) {
          newErrors.business = t("validation.businessMinLength");
          break;
        }
        break;
      }
      case "message": {
        if (value.trim() === "") {
          newErrors.message = t("validation.messageRequired");
          break;
        }
        if (value.length < 50) {
          newErrors.message = t("validation.messageMinLength");
          break;
        }
        break;
      }
      case "honeyField": {
        if (value.trim() !== "") {
          newErrors.honeyField = "";
        }
        break;
      }
    }
    setErrors(newErrors);
    return newErrors[name as keyof ContactFormValues];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    if (formValues.honeyField) {
      setLoading(false);
      return;
    }

    if (Object.keys(errors).length === 0) {
      const newErrors: Partial<ContactFormValues> = {};

      (Object.keys(formValues) as Array<keyof ContactFormValues>).forEach(
        (key) => {
          const err = validateForm(formValues[key], key);
          if (err) {
            newErrors[key] = err;
          }
        }
      );

      if (Object.keys(newErrors).length === 0) {
        setSuccess(t("success"));
      } else {
        setErrors(newErrors);
      }
    }
    setLoading(false);
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
                Object.keys(errors).length > 0 || loading
                  ? "opacity-50"
                  : ""
              }`}
              style={{ backgroundColor: "#FD7E14" }}
              disabled={Object.keys(errors).length > 0 || loading}
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
