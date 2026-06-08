import type { MutableRefObject } from "react";
import { gsap } from "gsap";

export const handleMouseEnter = (
  bubbleRefs: MutableRefObject<(HTMLElement | null)[]>,
  index: number
) => {
  if (bubbleRefs.current) {
    gsap.to(bubbleRefs.current[index], {
      scale: 1.1,
      cursor: "pointer",
      duration: 0.3,
      ease: "power1.out",
    });
  }
};

export const handleMouseLeave = (
  bubbleRefs: MutableRefObject<(HTMLElement | null)[]>,
  index: number
) => {
  if (bubbleRefs.current) {
    gsap.to(bubbleRefs.current[index], {
      scale: 1,
      duration: 0.3,
      ease: "power1.out",
    });
  }
};

export const handleBubbleClick = (
  bubbleRefs: MutableRefObject<(HTMLElement | null)[]>,
  index: number
) => {
  if (bubbleRefs.current) {
    gsap.to(bubbleRefs.current[index], {
      keyframes: [
        { scale: 1.5, opacity: 0, duration: 0.005 },
        { scale: 0, opacity: 0, duration: 0.3 },
      ],
      ease: "power3.inOut",
      onComplete: () => {
        window.location.href = "/owner/onboarding";
      },
    });
  }
};
