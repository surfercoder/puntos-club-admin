"use client";

import type { FC } from "react";
import { useTheme } from "next-themes";
import "@/components/landing/styles/contact-form.css";

import type { ContactFormValues } from "@/schemas/contact.schema";
export type { ContactFormValues } from "@/schemas/contact.schema";

interface InputFieldProps {
  name: keyof ContactFormValues;
  value: string;
  label: string;
  color: string;
  errors: Partial<ContactFormValues>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  setCircleRef: (el: HTMLDivElement | null) => void;
  colSpanMd?: number;
}

export const InputField: FC<InputFieldProps> = ({
  name,
  value,
  label,
  color,
  errors,
  onChange,
  setCircleRef,
  colSpanMd = 1,
}) => {
  const { resolvedTheme: theme } = useTheme();

  return (
    <div
      className={`flex flex-col gap-2 col-span-1 ${
        /* c8 ignore next */ colSpanMd === 2 && "md:col-span-2"
      }`}
    >
      <p className="font-light pl-7">{label}</p>
      <div className="relative">
        <div
          ref={setCircleRef}
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 size-6 rounded-full`}
          style={{ backgroundColor: color }}
        />
        <input
          aria-label={label}
          key={theme}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onChange}
          className="w-full pl-14 pr-4 py-4 md:py-5 dark:border-2 dark:border-white rounded-full bg-[#D9D9D9] dark:bg-transparent shadow-sm text-black dark:text-white text-sm lg:text-base focus:outline-none"
        />
      </div>
      <p className="text-[#FF0000] font-light pl-6 text-sm lg:text-base mt-1">
        {errors[name] && errors[name]}
      </p>
    </div>
  );
};
