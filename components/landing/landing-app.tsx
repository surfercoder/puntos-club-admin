"use client";

import Footer from "@/components/landing/components/footer";
import ContactForm from "@/components/landing/screens/contact-form";
import OperationSteps from "@/components/landing/screens/operation-steps";
import Profit from "@/components/landing/screens/profit";
import { useState, useRef, useEffect } from "react";
import { registerSlideAnimation } from "@/components/landing/animations/slide";
import { useGSAP } from "@gsap/react";
import WeDo from "@/components/landing/screens/we-do";
import Engines from "@/components/landing/screens/engines";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Loader from "@/components/landing/screens/loader";
import ParallaxSection from "@/components/landing/screens/parallax-section";
import { CallToAction } from "@/components/landing/components/call-to-action";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function LandingApp() {
  const weDoRef = useRef<HTMLDivElement | null>(null);
  const operationStepsRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const contactFormRef = useRef<HTMLDivElement | null>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [animationComplete, setAnimationComplete] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  registerSlideAnimation();

  const handleAnimationEnd = () => {
    setAnimationComplete(true);
    // Wait two frames so the conditional children (WeDo, OperationSteps, ...)
    // have mounted and their refs are populated before wiring up scroll triggers.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (weDoRef.current) {
          const weDotrigger = ScrollTrigger.create({
            trigger: weDoRef.current,
            start: "bottom bottom",
            end: "bottom 10%",
            onEnter: () => {
              gsap.effects.slide(weDoRef.current, {
                direction: "top",
                location: "in",
              });
            },
          });
          triggersRef.current.push(weDotrigger);
        }
        if (operationStepsRef.current) {
          const opsTween = gsap.to(operationStepsRef.current, {
            scrollTrigger: {
              trigger: operationStepsRef.current,
              start: "top 80%",
              end: "bottom 50%",
              toggleActions: "none play reverse none",
            },
            opacity: 0,
            duration: 2,
          });
          if (opsTween.scrollTrigger) triggersRef.current.push(opsTween.scrollTrigger);
        }
        if (lineRef.current && contactFormRef.current) {
          const scrollTriggerConfig = {
            trigger: lineRef.current,
            start: "top 30%",
            end: "top 50%",
            toggleActions: "none play none reverse" as const,
          };

          const lineTween = gsap.to(lineRef.current, {
            scrollTrigger: scrollTriggerConfig,
            x: "100%",
            duration: 2,
          });
          if (lineTween.scrollTrigger) triggersRef.current.push(lineTween.scrollTrigger);

          const contactTween = gsap.to(contactFormRef.current, {
            scrollTrigger: scrollTriggerConfig,
            x: 0,
            duration: 2,
            onComplete: () => {
              circleRefs.current.forEach((circle, index) => {
                gsap.to(circle, {
                  keyframes: [{ scale: 1.3 }, { scale: 1 }],
                  duration: 0.8,
                  delay: 0.5 * index + 0.5,
                });
              });
            },
          });
          if (contactTween.scrollTrigger) triggersRef.current.push(contactTween.scrollTrigger);
        }
      });
    });
  };

  useEffect(() => {
    return () => {
      triggersRef.current.forEach((t) => t.kill());
      triggersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (loaderRef.current) {
      gsap.to(loaderRef.current, {
        scrollTrigger: {
          trigger: loaderRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
        opacity: 0,
        ease: "none",
      });
    }
  }, []);

  return (
    <>
      {/* Loader always present, animation controlled by state */}
      <div
        ref={loaderRef}
        className={`fixed top-0 left-0 w-full h-screen z-[1000] transition-opacity duration-0 ${
          animationComplete
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        }`}
      >
        <Loader onAnimationEnd={handleAnimationEnd} />
      </div>

      {/* Scroll indicator */}
      {animationComplete && <CallToAction />}

      {/* ParallaxSection shown after animation completes */}
      <div style={{ height: "100vh", marginTop: "1500px" }}>
        {animationComplete && <ParallaxSection />}
      </div>

      {animationComplete && (
        <div className="bg-background overflow-x-hidden flex flex-col items-center">
          <div className="h-[20vh]"></div>
          <div
            ref={weDoRef}
            className="flex w-full justify-center -translate-y-full mt-10"
          >
            <WeDo />
          </div>
          <div
            ref={operationStepsRef}
            className="flex w-full justify-center mt-5"
          >
            <OperationSteps />
          </div>
          <Engines />
          <div
            className="w-full h-6 mt-12"
            style={{
              background:
                "linear-gradient(to right, #FD7E14, #FF4573, #31A1D6)",
            }}
          ></div>
          <Profit />
          <div
            ref={lineRef}
            className="w-full h-6 mt-12"
            style={{
              background:
                "linear-gradient(to right, #FD7E14, #FF4573, #31A1D6)",
            }}
          ></div>
          <div ref={contactFormRef} className="w-full -translate-x-full">
            <ContactForm circleRefs={circleRefs} />
          </div>
          <Footer />
        </div>
      )}
    </>
  );
}
