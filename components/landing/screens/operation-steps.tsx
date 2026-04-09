"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { useTheme } from "next-themes";
import { operationSteps } from "@/components/landing/constants/operation-steps";
import { registerSlideAnimation } from "@/components/landing/animations/slide";
import { registerGrowAnimation } from "@/components/landing/animations/grow";
import {
  handleBubbleClick,
  handleMouseEnter,
  handleMouseLeave,
} from "@/components/landing/animations/bubble";
import "@/components/landing/styles/operation-steps.css";
import Bubbles from "@/components/landing/components/bubbles";
import React from "react";
import { Gift } from "@/components/landing/components/gift-svg";
import useMediaQuery from "@/components/landing/hooks/use-media-query";
import Image from "next/image";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const OperationSteps = () => {
  const { resolvedTheme: theme } = useTheme();
  const isSmall = useMediaQuery("(max-width: 640px)");
  const t = useTranslations("Landing.steps");

  const container = useRef(null);
  const giftRef = useRef(null);
  const numberStepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  registerGrowAnimation();
  registerSlideAnimation();

  useGSAP(
    () => {
      numberStepRefs.current.forEach((stepRef) => {
        if (stepRef) {
          ScrollTrigger.create({
            trigger: stepRef,
            start: "top bottom",
            end: "bottom top",
            onEnter: () => gsap.effects.grow(stepRef),
            onLeaveBack: () => gsap.to(stepRef, { scale: 0 }),
          });
        }
      });

      lineRefs.current.forEach((lineRef) => {
        if (lineRef) {
          ScrollTrigger.create({
            trigger: lineRef,
            start: "top bottom",
            end: "bottom top",
            onEnter: () =>
              gsap.effects.slide(lineRef, {
                direction: "top",
                location: "in",
              }),
            onLeaveBack: () => gsap.to(lineRef, { y: "-100%" }),
          });
        }
      });

      textRefs.current.forEach((textRef, index) => {
        if (textRef) {
          ScrollTrigger.create({
            trigger: textRef,
            start: "top bottom",
            end: "bottom top",
            onEnter: () =>
              gsap.effects.slide(textRef, {
                direction: index % 2 === 0 ? "right" : "left",
                location: "in",
              }),
            onLeaveBack: () =>
              gsap.to(textRef, {
                x: index % 2 === 0 ? "100%" : "-100%",
              }),
          });
        }
      });

      if (giftRef.current) {
        const lastLineRef = lineRefs.current[lineRefs.current.length - 1];
        ScrollTrigger.create({
          trigger: lastLineRef,
          start: "top bottom",
          onEnter: () => gsap.effects.grow(giftRef.current, { delay: 1 }),
        });
      }
    },
    { scope: container }
  );

  return (
    <div
      className="flex flex-col items-center w-full gap-6"
      ref={container}
    >
      {operationSteps.map((step, index) => {
        const title = t(`${index}.title`);
        const highlightedWord = t(`${index}.highlightedWord`);
        const content = t(`${index}.content`);
        const contentLines = content.includes("\n") ? content.split("\n") : null;
        const stepKey = `step-${step.logo_url}`;

        return (
          <div
            key={stepKey}
            className="flex flex-col items-center w-full sm:w-[95%] lg:w-[90%] gap-6"
          >
            <div
              className="scale-0 flex items-center justify-center text-4xl sm:text-5xl font-bold w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4"
              style={{
                color: theme === "dark" ? step.lightColor : step.darkColor,
                borderColor:
                  theme === "dark" ? step.lightColor : step.darkColor,
                backgroundColor:
                  theme === "dark" ? step.darkColor : step.lightColor,
              }}
              ref={(el) => {
                numberStepRefs.current[index] = el;
              }}
            >
              {index + 1}
            </div>
            <div
              className={`flex items-stretch w-full ${
                index % 2 !== 0 && "flex-row-reverse"
              }`}
            >
              <div
                className={`flex flex-col ${
                  index % 2 === 0 ? "items-end" : "items-start"
                } justify-center flex-1 overflow-x-hidden gap-6 my-6`}
              >
                <div
                  className={`flex flex-col ${
                    index % 2 === 0
                      ? "items-end translate-x-full pl-2 pr-4 sm:pr-6 md:pr-8"
                      : "items-start -translate-x-full pr-2 pl-4 sm:pl-6 md:pl-8"
                  } justify-center flex-1 overflow-x-hidden gap-6 my-6`}
                  ref={(el) => {
                    textRefs.current[index] = el;
                  }}
                >
                  <h3
                    className={`${
                      index % 2 === 0 ? "text-end m-0" : "text-start"
                    } font-bold text-xl sm:text-3xl md:text-4xl lg:text-6xl lg:max-w-[90%]`}
                  >
                    {title
                      .split(
                        new RegExp(`(${highlightedWord})`, "gi")
                      )
                      .map((word, wIdx) => {
                        const wordKey = `${stepKey}-word-${wIdx}-${word}`;
                        return word.toLowerCase() === highlightedWord.toLowerCase() ? (
                          <span
                            key={wordKey}
                            style={{
                              color:
                                theme === "dark"
                                  ? step.lightColor
                                  : step.darkColor,
                            }}
                          >
                            {word}
                          </span>
                        ) : (
                          <span key={wordKey}>{word}</span>
                        );
                      })}
                  </h3>

                  <p
                    className={`${
                      index % 2 === 0 ? "text-end m-0" : "text-start"
                    } w-[95%] lg:max-w-[80%] font-normal text-xs sm:text-base md:text-lg lg:text-xl`}
                  >
                    {contentLines
                      ? contentLines.map(
                          (c: string, subindex: number) => (
                            <React.Fragment key={`${stepKey}-line-${subindex}-${c.slice(0, 10)}`}>
                              {c}
                              <br />
                            </React.Fragment>
                          )
                        )
                      : content}
                  </p>
                </div>
              </div>
              <div className="w-2.5 min-h-full overflow-hidden rounded-[20px]">
                <div
                  className="rounded-[20px] w-full h-full"
                  style={{
                    backgroundColor:
                      theme === "dark" ? step.lightColor : step.darkColor,
                  }}
                  ref={(el) => {
                    lineRefs.current[index] = el;
                  }}
                />
              </div>
              <div className="w-full flex items-center justify-center relative flex-1">
                <div
                  ref={(el) => {
                    bubbleRefs.current[index] = el;
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={title}
                  className="flex items-center justify-center w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full z-[1] bubble"
                  style={{
                    backgroundColor: step.lightColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.willChange = "transform";
                    handleMouseEnter(bubbleRefs, index);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.willChange = "auto";
                    handleMouseLeave(bubbleRefs, index);
                  }}
                  onClick={() => handleBubbleClick(bubbleRefs, index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleBubbleClick(bubbleRefs, index);
                    }
                  }}
                >
                  <Image
                    src={`/icons/cromatico/${step.logo_url}`}
                    alt={title}
                    width={144}
                    height={144}
                    className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36"
                  />
                </div>

                <Bubbles index={index} backgroundColor={step.lightColor} />
              </div>
            </div>
          </div>
        );
      })}
      <div ref={giftRef} className="scale-0 z-10">
        <Gift
          className="-mt-16 md:-mt-20 -mb-36 md:-mb-52"
          style={{
            width: isSmall ? 280 : 400,
            height: isSmall ? 280 : 400,
          }}
        />
      </div>
    </div>
  );
};

export default OperationSteps;
