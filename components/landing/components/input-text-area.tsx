"use client";

import type { FC, MutableRefObject } from "react";
import "@/components/landing/styles/contact-form.css";

import type { ContactFormValues } from "@/schemas/contact.schema";

interface InputTextAreaProps {
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
}

export const InputTextArea: FC<InputTextAreaProps> = ({
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
          className="absolute left-4 top-5 size-6 rounded-full"
          style={{ backgroundColor: color }}
        />
        <textarea
          aria-label={label}
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
