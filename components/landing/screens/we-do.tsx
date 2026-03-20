"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "@/components/landing/styles/we-do.css";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function WeDo() {
  const t = useTranslations("Landing.weDo");

  return (
    <div className="we-do-container flex w-[90%] lg:w-[95%] max-w-6xl mb-24 flex-col items-center text-center md:justify-between md:flex-row md:text-start gap-6">
      <h1 className="max-w-96 lg:max-w-[35%] text-[36px] md:text-[48px] lg:text-7xl leading-60 font-black">
        {t("title")}
      </h1>
      <p className="md:max-w-[65%] md:ml-5 text-2xl md:text-[24px] md:leading-10 lg:text-3xl">
        <span className="linear-text font-extrabold">{t("descriptionPrefix")}</span>{" "}
        {t("description")}
      </p>
    </div>
  );
}
