"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { bubbles } from "@/components/landing/constants/bubbles";
import {
  handleBubbleClick,
  handleMouseEnter,
  handleMouseLeave,
} from "@/components/landing/animations/bubble";
import useMediaQuery from "@/components/landing/hooks/use-media-query";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const Bubbles = ({
  index,
  backgroundColor,
}: {
  index: number;
  backgroundColor: string;
}) => {
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMobile = useMediaQuery("(max-width: 500px)");

  useGSAP(() => {
    const distance = typeof window !== "undefined" && window.innerWidth < 640 ? 50 : 70;
    bubbleRefs.current.forEach((bubbleRef, idx) => {
      if (bubbleRef) {
        gsap.to(bubbleRef, {
          y: -distance,
          scrollTrigger: {
            trigger: bubbleRef,
            toggleActions: "play none none reverse",
            start: "top 100%",
            end: "top 0%",
            scrub: 1,
            refreshPriority: idx,
          },
          delay: idx * 0.3,
        });
      }
    });
  });

  return bubbles[index].map((bubble, bIdx) => {
    return (
      <div
        key={bIdx}
        className="absolute flex items-center justify-center z-10 rounded-full bubble"
        ref={(el) => {
          bubbleRefs.current[bIdx] = el;
        }}
        style={{
          width:
            !isMobile || bubble.size < 35 ? bubble.size : bubble.size - 25,
          height:
            !isMobile || bubble.size < 35 ? bubble.size : bubble.size - 25,
          top: bubble.top,
          left: bubble.left,
          backgroundColor,
          willChange: "transform",
        }}
        onMouseEnter={() => handleMouseEnter(bubbleRefs, bIdx)}
        onMouseLeave={() => handleMouseLeave(bubbleRefs, bIdx)}
        onClick={() => handleBubbleClick(bubbleRefs, bIdx)}
      />
    );
  });
};

export default Bubbles;
