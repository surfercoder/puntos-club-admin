"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

export const CallToAction = () => {
  const ref = useRef<HTMLButtonElement | null>(null);
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

  return (
    <button
      type="button"
      ref={ref}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-5 cursor-pointer bg-transparent border-none p-0"
      onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })}
    >
      <p className="mb-1 text-center text-sm font-medium text-muted-foreground tracking-wide">
        {t("callToAction")}
      </p>
      <div className="animate-[nudge_2s_cubic-bezier(0.16,1,0.3,1)_infinite]">
        <ChevronDown className="size-6 text-brand-pink" strokeWidth={2.5} />
      </div>
    </button>
  );
};
