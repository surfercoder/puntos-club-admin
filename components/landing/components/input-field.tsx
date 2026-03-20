"use client";

import { useEffect, useState } from "react";
import type { FC, MutableRefObject } from "react";
import { useTheme } from "next-themes";
import "@/components/landing/styles/contact-form.css";

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  business: string;
  message: string;
  honeyField: string;
}

interface InputFieldProps {
  name: keyof ContactFormValues;
  value: string;
  label: string;
  color: string;
  errors: Partial<ContactFormValues>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  circleRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  index: number;
  colSpanMd?: number;
}

export const InputField: FC<InputFieldProps> = ({
  name,
  value,
  label,
  color,
  errors,
  onChange,
  circleRefs,
  index,
  colSpanMd = 1,
}) => {
  const { resolvedTheme: theme } = useTheme();
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    setInputKey((prevKey) => (prevKey === 0 ? 1 : 0));
  }, [theme]);

  return (
    <div
      className={`flex flex-col gap-2 col-span-1 ${
        colSpanMd === 2 && "md:col-span-2"
      }`}
    >
      <p className="font-light pl-7">{label}</p>
      <div className="relative">
        <div
          ref={(el) => {
            circleRefs.current[index] = el;
          }}
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full`}
          style={{ backgroundColor: color }}
        />
        <input
          key={inputKey}
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

interface PhoneNumberFieldProps {
  label: string;
  value: string;
  errors: Partial<ContactFormValues>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  circleRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  index: number;
}

export const PhoneNumberField: FC<PhoneNumberFieldProps> = ({
  label,
  value,
  errors,
  onChange,
  circleRefs,
  index,
}) => {
  const { resolvedTheme: theme } = useTheme();
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    setInputKey((prevKey) => (prevKey === 0 ? 1 : 0));
  }, [theme]);

  return (
    <div className="flex flex-col gap-2">
      <p className="font-light pl-7">{label}</p>
      <div className="relative">
        <div
          ref={(el) => {
            circleRefs.current[index] = el;
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full z-10"
          style={{ backgroundColor: "#FF4573" }}
        />
        <input
          key={inputKey}
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

export const InputTextArea: FC<InputFieldProps> = ({
  name,
  value,
  label,
  color,
  errors,
  onChange,
  circleRefs,
  index,
}) => {
  return (
    <div className="flex flex-col col-span-1 md:col-span-2 gap-3">
      <p className="font-light pl-7">{label}</p>
      <div className="relative">
        <div
          ref={(el) => {
            circleRefs.current[index] = el;
          }}
          className="absolute left-4 top-5 w-6 h-6 rounded-full"
          style={{ backgroundColor: color }}
        />
        <textarea
          name={name}
          value={value}
          rows={3}
          onChange={onChange}
          onBlur={onChange}
          className="w-full pl-14 pr-4 py-5 dark:border-2 dark:border-white rounded-3xl bg-[#D9D9D9] dark:bg-transparent shadow-sm text-black dark:text-white text-sm lg:text-base focus:outline-none resize-none"
          style={{ marginRight: "1rem" }}
        />
      </div>
      <p className="text-[#FF0000] font-light pl-6 text-sm lg:text-base">
        {errors[name] && errors[name]}
      </p>
    </div>
  );
};
