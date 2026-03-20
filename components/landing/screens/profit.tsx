"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { registerSlideAnimation } from "@/components/landing/animations/slide";
import useMediaQuery from "@/components/landing/hooks/use-media-query";
import {
  pointsBigScreen,
  pointsMobile,
  pointsSmallScreen,
} from "@/components/landing/constants/profits";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP, MotionPathPlugin, ScrollTrigger);

export default function Profit() {
  const [currentDescription, setCurrentDescription] = useState<string[]>([]);
  const [currentColor, setCurrentColor] = useState<string>();
  const t = useTranslations("Landing.profit");

  const isSmall = useMediaQuery("(max-width: 640px)");
  const isMobile = useMediaQuery("(max-width: 500px)");

  registerSlideAnimation();
  const titleRef = useRef(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPolylineElement>(null);
  const pointRefs = useRef<(SVGCircleElement | null)[]>([]);
  const textRefs = useRef<(SVGGElement | null)[]>([]);
  const handRefs = useRef<(SVGGElement | null)[]>([]);

  const points = isSmall
    ? isMobile
      ? pointsMobile
      : pointsSmallScreen
    : pointsBigScreen;

  const getDescriptionLines = (descKey: string): string[] => {
    return t(`desc${descKey}`).split("\n");
  };

  useEffect(() => {
    if (circleRef.current && points.length > 0) {
      const firstPoint = points[0];
      gsap.set(circleRef.current, {
        x: firstPoint.x,
        y: firstPoint.y,
      });
    }

    if (titleRef.current) {
      ScrollTrigger.create({
        trigger: titleRef.current,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => {
          gsap.effects.slide(titleRef.current, {
            duration: 0.8,
            direction: "top",
            location: "in",
          });
        },
      });
    }

    if (
      circleRef.current &&
      pathRef.current &&
      pointRefs.current &&
      textRefs.current
    ) {
      const pathData = points
        .map((point, index) =>
          index === 0
            ? `M${point.x},${point.y}`
            : `L${point.x},${point.y}`
        )
        .join(" ");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pathRef.current,
          start: "top 80%",
          once: true,
        },
      });

      tl.add(
        gsap.to(circleRef.current, {
          ease: "power1.inOut",
          motionPath: pathData,
          duration: 12,
          onUpdate: () => {
            const x = gsap.getProperty(circleRef.current, "x") as number;
            const y = gsap.getProperty(circleRef.current, "y") as number;
            const pointFound = points.find(
              (point) =>
                Math.abs(point.x - x) < 10 && Math.abs(point.y - y) < 10
            );
            if (pointFound) {
              const point = pointRefs.current.find(
                (point) =>
                  parseInt(point!.getAttribute("cx")!) === pointFound.x &&
                  parseInt(point!.getAttribute("cy")!) === pointFound.y
              );
              if (point) {
                setCurrentDescription(
                  pointFound.descKey
                    ? getDescriptionLines(pointFound.descKey)
                    : []
                );
                setCurrentColor(pointFound.color);
                gsap.to(circleRef.current!, {
                  fill: pointFound.color,
                  duration: 0.5,
                });
                gsap.to(point!, { opacity: 1, duration: 0.1 });
              }
              const text = textRefs.current.find((text) => {
                if (!text) return false;
                const classList = text!.classList;
                return (
                  classList.contains(`x-${pointFound.x}`) &&
                  classList.contains(`y-${pointFound.y}`)
                );
              });
              if (text) {
                gsap.to(text!, { opacity: 1, duration: 0.8 });
              }
            }
          },
        })
      );

      if (isMobile) {
        tl.to(pointRefs.current.slice(1, -1), {
          scale: 1.3,
          transform: "translate(-5px, -5px)",
          duration: 0.8,
          repeat: 5,
          yoyo: true,
          ease: "power1.inOut",
        })
          .to(
            handRefs.current,
            {
              opacity: 1,
              scale: 1.3,
              duration: 0.8,
              repeat: 5,
              yoyo: true,
              ease: "power1.inOut",
            },
            "<"
          )
          .to(handRefs.current, { scale: 1.3, opacity: 1 });
      }
    }
  }, [isSmall, points, isMobile]);

  const handleCircleClick = (descLines: string[], color: string) => {
    setCurrentDescription(descLines);
    setCurrentColor(color);
  };

  return (
    <div className="flex flex-col h-[90vh] md:h-[92vh] items-center justify-center">
      <div className="flex h-fit justify-center overflow-hidden">
        <h1
          ref={titleRef}
          className="w-fit h-fit border-solid border border-t-0 border-opacity-10 rounded-xl rounded-t-none py-5 px-6 text-2xl md:text-3xl lg:text-4xl font-extrabold"
        >
          {t("sectionTitle")}
        </h1>
      </div>
      <div className="flex flex-1 h-full items-center justify-center sm:mt-8">
        <svg
          key={isSmall ? "small-screen" : "big-screen"}
          width="100%"
          height="65vh"
          viewBox={
            isSmall
              ? isMobile
                ? "0 0 600 600"
                : "0 0 800 600"
              : "0 0 900 400"
          }
        >
          <polyline
            ref={pathRef}
            points={points.reduce((acc, point) => {
              return acc + `${point.x},${point.y} `;
            }, "")}
            fill="none"
            stroke="gray"
            strokeWidth="4"
            className="z-0"
            width="100%"
          />

          <circle
            ref={circleRef}
            cx="0"
            cy="0"
            r={isSmall ? "15" : "10"}
            fill="#FFB03A"
            className="z-[3]"
          />

          {points.map((point, index) => (
            <g key={index}>
              <circle
                ref={(el) => {
                  pointRefs.current[index] = el;
                }}
                cx={point.x}
                cy={point.y}
                r={isSmall ? "15" : "10"}
                fill={point.color}
                className="z-[1] opacity-0"
                onClick={() =>
                  handleCircleClick(
                    point.descKey
                      ? getDescriptionLines(point.descKey)
                      : [],
                    point.color
                  )
                }
              />
              {index > 0 && index < points.length - 1 && (
                <g
                  ref={(el) => {
                    handRefs.current[index] = el;
                  }}
                  transform={`translate(${point.x - 10}, ${point.y - 12})`}
                  className="opacity-0 absolute"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1"
                    stroke="currentColor"
                    width="34"
                    height="34"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"
                    />
                  </svg>
                </g>
              )}
            </g>
          ))}

          {points.map((point, index) => {
            if (point.titleKey && point.descKey) {
              const title = t(`title${point.titleKey}`);
              const descLines = getDescriptionLines(point.descKey);
              return (
                <g
                  key={index}
                  ref={(el) => {
                    textRefs.current[index] = el;
                  }}
                  transform={`translate(${point.x}, ${
                    index % 2 === 0
                      ? isMobile
                        ? point.y - 55
                        : descLines.length > 2
                        ? point.y - 98
                        : point.y - 75
                      : isMobile
                      ? point.y + 25
                      : point.y + 45
                  })`}
                  textAnchor="middle"
                  className={`opacity-0 x-${point.x} y-${point.y}`}
                >
                  <text
                    y="-5"
                    className="translate-y-7 sm:translate-y-0 text-2xl sm:text-2xl font-bold fill-black dark:fill-white w-full text-center"
                  >
                    {title}
                  </text>

                  {descLines.map(
                    (word: string, dIdx: number) => (
                      <text
                        key={dIdx}
                        y={25 * (dIdx + 1)}
                        className="text-lg md:text-base fill-black dark:fill-white hidden sm:block"
                      >
                        {word}
                      </text>
                    )
                  )}
                </g>
              );
            }
            return null;
          })}
        </svg>
      </div>

      <div
        style={{
          borderColor:
            currentDescription.length > 0 ? currentColor : "transparent",
        }}
        className="flex flex-col w-80 min-h-20 justify-center py-3 px-4 border-black border-2 rounded-xl sm:hidden"
      >
        {currentDescription.map((descr, dIdx) => (
          <p key={dIdx} className="text-center text-sm">
            {descr}
          </p>
        ))}
      </div>
    </div>
  );
}
