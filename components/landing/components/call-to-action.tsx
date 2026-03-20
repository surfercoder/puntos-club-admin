"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const CallToAction = () => {
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const t = useTranslations("Landing");

  useEffect(() => {
    if (ref.current) {
      gsap.to(ref.current, {
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
          end: "bottom 80%",
          scrub: true,
        },
        opacity: 0,
        ease: "none",
      });
    }
  }, []);

  const chevronColors = [
    "#FCD2DC",
    "#FF7D9D",
    "#FF4573",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveColorIndex(
        (prevIndex) =>
          (prevIndex - 1 + chevronColors.length) % chevronColors.length
      );
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-5 transition-opacity duration-500 ease-in-out"
    >
      <h3 className="mb-3 md:mb-2 text-center text-xl font-bold">
        {t("callToAction")}
      </h3>
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="w-8 h-8 md:w-[28px] md:h-[28px] flex justify-center items-center -mt-4 md:-mt-3 transition-all duration-1000 ease-in-out"
          style={{
            transition: "border-color 1s ease-in-out",
          }}
        >
          <div
            className="w-8 h-8 md:w-[28px] md:h-[28px] border-b-[6px] border-r-[6px] transform rotate-45"
            style={{
              borderColor:
                chevronColors[
                  (activeColorIndex + index) % chevronColors.length
                ],
            }}
          ></div>
        </div>
      ))}
    </div>
  );
};
