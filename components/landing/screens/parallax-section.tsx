"use client";

import React, { useLayoutEffect, useRef, useState, useEffect, Component, type ErrorInfo, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const Smartphone3D = dynamic(() => import("./smartphone-3d"), {
  ssr: false,
  loading: () => null,
});

class Smartphone3DErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn("Smartphone3D failed to load:", error.message);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

gsap.registerPlugin(ScrollTrigger);

const ParallaxSection: React.FC = () => {
  const t = useTranslations("Landing.parallax");

  const messages = [
    {
      text: t("message1"),
      icon: "/icons/positivo/Happy.svg",
    },
    {
      text: t("message2"),
      icon: "/icons/positivo/Medal.svg",
    },
    {
      text: t("message3"),
      icon: "/icons/positivo/Goal.svg",
    },
  ];

  const sectionRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const smartphoneRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [rotateSmartphone, setRotateSmartphone] = useState(false);
  const messageTimeline = useRef<gsap.core.Timeline | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 800);
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const message = messageRef.current;
    const smartphone = smartphoneRef.current;
    const icon = iconRef.current;

    gsap.fromTo(
      section,
      { y: "20%" },
      {
        y: "0%",
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: isMobile ? "top 90%" : "top bottom",
          end: isMobile ? "top 10%" : "top top",
          scrub: 1,
        },
      }
    );

    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: section,
      start: "top 75%",
      once: true,
      onEnter: () => {
        gsap.fromTo(
          [message, smartphone, icon],
          { y: "-100%", opacity: 0 },
          { y: "0%", opacity: 1, duration: 2, ease: "power2.out" }
        );

        messageTimeline.current = gsap.timeline({
          repeat: -1,
          delay: 2,
          repeatDelay: 1.5,
        });

        messageTimeline.current
          .to([message, icon], {
            y: "-100%",
            opacity: 0,
            duration: 0.8,
            ease: "power2.in",
            onStart: () => setRotateSmartphone(true),
            onComplete: () => {
              setCurrentMessageIndex(
                (prevIndex) => (prevIndex + 1) % messages.length
              );
            },
          })
          .fromTo(
            [message, icon],
            { y: "100%", opacity: 0 },
            {
              y: "0%",
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
              onComplete: () => setRotateSmartphone(false),
            }
          );
      },
    });

    return () => {
      scrollTriggerInstance.kill();
      messageTimeline.current?.kill();
    };
  }, [isMobile]);

  const splitMessage = (message: string) => {
    const words = message.split(" ");
    const lastWord = words.pop();
    const restOfMessage = words.join(" ");
    return { restOfMessage, lastWord };
  };

  const currentMessage = splitMessage(messages[currentMessageIndex].text);
  const currentIcon = messages[currentMessageIndex].icon;

  return (
    <div
      ref={sectionRef}
      className="relative h-screen z-10 mt-[800px] lg:mt-[1200px]"
      style={{ backgroundColor: "#31A1D6" }}
    >
      <div
        className="absolute -top-[499px] left-0 right-0 h-[500px] -z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(49, 161, 214, 1), rgba(0, 0, 0, 0))",
        }}
      />
      <div
        className="absolute h-0 w-0 -bottom-[99px] left-0 border-x-[50vw] border-x-transparent border-t-[100px] -z-10"
        style={{ borderTopColor: "#31A1D6" }}
      />
      <div
        ref={smartphoneRef}
        className="absolute h-screen w-[40vw] md:w-[40%] lg:w-[50%] right-[10%] my-0 mx-auto -top-[3%] lg:right-[2%] lg:-top-[7%]"
      >
        <Smartphone3DErrorBoundary>
          <Smartphone3D
            triggerRotation={rotateSmartphone}
            onCompleteRotation={() => setRotateSmartphone(false)}
          />
        </Smartphone3DErrorBoundary>
      </div>

      <div className="absolute left-[5%] top-[39%] lg:left-[10%] lg:top-[35%] flex flex-col font-black text-center items-center justify-center w-[45%] lg:w-[50%]">
        <div
          ref={iconRef}
          className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] lg:w-[100px] lg:h-[100px] bg-white mb-5 rounded-[50%]"
        >
          <div
            className="w-[80%] h-[80%] m-[10%] bg-contain bg-no-repeat bg-center"
            style={{
              backgroundImage: `url(${currentIcon})`,
            }}
          />
        </div>

        <div
          ref={messageRef}
          className="text-2xl md:text-3xl lg:text-5xl font-bold"
        >
          <span>{currentMessage.restOfMessage} </span>
          <span className="text-white">{currentMessage.lastWord}</span>
        </div>
      </div>
    </div>
  );
};

export default ParallaxSection;
