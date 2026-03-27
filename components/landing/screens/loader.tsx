"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { Gift } from "@/components/landing/components/gift-svg";
import { useTranslations } from "next-intl";

gsap.registerPlugin(TextPlugin);

interface LoaderProps {
  onAnimationEnd: () => void;
}

const Loader: React.FC<LoaderProps> = ({ onAnimationEnd }) => {
  const animationPlayed = useRef(false);
  const t = useTranslations("Landing.loader");

  useEffect(() => {
    /* c8 ignore next */
    if (animationPlayed.current) return;
    animationPlayed.current = true;

    document.body.style.overflow = "hidden";

    const gift = document.getElementById("gift-group");
    const gift1 = document.getElementById("gift-group1");
    const bg = document.getElementById("bg");
    const tapa = document.getElementById("tapa");
    const tapa1 = document.getElementById("tapa1");
    const title = document.getElementById("title");
    const slogan = document.getElementById("slogan");

    gsap.to([gift, gift1], {
      duration: 0.5,
      repeat: 1,
      yoyo: true,
      transformOrigin: "center center",
      ease: "power1.inOut",
      keyframes: [{ rotation: -3 }, { rotation: 3 }],
      onComplete: () => {
        gsap.to(bg, {
          scale: 1,
          borderRadius: "50%",
          duration: 0.2,
          ease: "power1.inOut",
          onComplete: () => {
            gsap.to([bg, gift, gift1], {
              y: -30,
              duration: 0.2,
              ease: "power1.inOut",
              onComplete: () => {
                gsap.to([tapa, tapa1], {
                  y: -40,
                  duration: 0.4,
                  ease: "power1.out",
                  yoyo: true,
                  repeat: 1,
                  onComplete: () => {
                    gsap.to(title, {
                      opacity: 1,
                      y: 20,
                      duration: 0.2,
                      ease: "power2.out",
                      onComplete: () => {
                        gsap.to(slogan, {
                          duration: 0.4,
                          text: document.getElementById("slogan-text")?.textContent || /* c8 ignore next */ "",
                          ease: "power2.out",
                          opacity: 1,
                          onComplete: () => {
                            document.body.style.overflowY = "auto";
                            document.body.style.overflowX = "hidden";
                            if (onAnimationEnd) {
                              onAnimationEnd();
                            }
                          },
                        });
                      },
                    });
                  },
                });
              },
            });
          },
        });
      },
    });
  }, [onAnimationEnd]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Hidden element to store translated slogan for GSAP text plugin */}
      <span id="slogan-text" className="hidden">{t("slogan")}</span>
      <div
        id="bg"
        style={{
          width: "300px",
          height: "300px",
          backgroundColor: "#2DA9E2",
          position: "absolute",
          top: "35%",
          left: "50%",
          transform: "translate(-50%, -50%) scale(10)",
          transition: "transform 0.5s ease, background-color 0.5s ease",
          borderRadius: "100%",
        }}
      />

      <Gift
        className="absolute z-[1] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
        style={{ width: "300px", height: "100vh" }}
      />
      <div className="flex flex-col w-full items-center justify-center absolute top-1/2 left-1/2 transform -translate-x-1/2">
        <h1
          id="title"
          className="opacity-0 font-extrabold z-10 text-center text-5xl sm:text-7xl md:text-8xl"
        >
          Puntos <span style={{ color: "#E25380" }}>Club</span>
        </h1>

        <h2
          id="slogan"
          className="opacity-0 w-[90%] text-center text-gray-800 dark:text-gray-300 font-light z-10 mt-6 text-xl sm:text-2xl md:text-3xl"
        >{t("slogan")}</h2>
      </div>
    </div>
  );
};

export default Loader;
