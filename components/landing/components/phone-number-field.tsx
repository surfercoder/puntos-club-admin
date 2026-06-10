"use client";

import type { FC } from "react";
import { useTheme } from "next-themes";
import "@/components/landing/styles/contact-form.css";

import type { ContactFormValues } from "@/schemas/contact.schema";

interface PhoneNumberFieldProps {
  label: string;
  value: string;
  errors: Partial<ContactFormValues>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  setCircleRef: (el: HTMLDivElement | null) => void;
}

export const PhoneNumberField: FC<PhoneNumberFieldProps> = ({
  label,
  value,
  errors,
  onChange,
  setCircleRef,
}) => {
  const { resolvedTheme: theme } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      <p className="font-light pl-7">{label}</p>
      <div className="relative">
        <div
          ref={setCircleRef}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 size-6 rounded-full z-10"
          style={{ backgroundColor: "#FF4573" }}
        />
        <input
          aria-label={label}
          key={theme}
          type="tel"
          name="phoneNumber"
          value={value}
          onChange={onChange}
          onBlur={onChange}
          placeholder="+54"
          className="w-full pl-14 pr-4 py-4 md:py-5 dark:border-2 dark:border-white rounded-full bg-[#D9D9D9] dark:bg-transparent shadow-sm text-black dark:text-white text-sm lg:text-base focus:outline-none"
        />
      </div>
      <p className="text-[#FF0000] font-light pl-6 text-sm lg:text-base mt-1">
        {errors["phoneNumber"] && errors["phoneNumber"]}
      </p>
    </div>
  );
};
