jest.mock("gsap", () => ({
  __esModule: true,
  gsap: { to: jest.fn(), registerEffect: jest.fn() },
}));

import { gsap } from "gsap";
import type { MutableRefObject } from "react";
import {
  handleMouseEnter,
  handleMouseLeave,
  handleBubbleClick,
} from "@/components/landing/animations/bubble";

const mockedTo = gsap.to as jest.Mock;

function makeBubbleRefs(
  elements: (HTMLDivElement | null)[]
): MutableRefObject<(HTMLDivElement | null)[]> {
  return { current: elements };
}

describe("bubble animations", () => {
  beforeEach(() => {
    mockedTo.mockClear();
  });

  describe("handleMouseEnter", () => {
    it("calls gsap.to with scale 1.1 on the target element", () => {
      const el = document.createElement("div");
      const refs = makeBubbleRefs([el]);

      handleMouseEnter(refs, 0);

      expect(mockedTo).toHaveBeenCalledTimes(1);
      expect(mockedTo).toHaveBeenCalledWith(el, {
        scale: 1.1,
        cursor: "pointer",
        duration: 0.3,
        ease: "power1.out",
      });
    });

    it("does not call gsap.to when bubbleRefs.current is null", () => {
      const refs = { current: null } as unknown as MutableRefObject<
        (HTMLDivElement | null)[]
      >;

      handleMouseEnter(refs, 0);

      expect(mockedTo).not.toHaveBeenCalled();
    });
  });

  describe("handleMouseLeave", () => {
    it("calls gsap.to with scale 1 on the target element", () => {
      const el = document.createElement("div");
      const refs = makeBubbleRefs([el]);

      handleMouseLeave(refs, 0);

      expect(mockedTo).toHaveBeenCalledTimes(1);
      expect(mockedTo).toHaveBeenCalledWith(el, {
        scale: 1,
        duration: 0.3,
        ease: "power1.out",
      });
    });

    it("does not call gsap.to when bubbleRefs.current is null", () => {
      const refs = { current: null } as unknown as MutableRefObject<
        (HTMLDivElement | null)[]
      >;

      handleMouseLeave(refs, 0);

      expect(mockedTo).not.toHaveBeenCalled();
    });
  });

  describe("handleBubbleClick", () => {
    it("calls gsap.to with keyframes on the target element", () => {
      const el = document.createElement("div");
      const refs = makeBubbleRefs([el]);

      handleBubbleClick(refs, 0);

      expect(mockedTo).toHaveBeenCalledTimes(1);
      expect(mockedTo).toHaveBeenCalledWith(el, {
        keyframes: [
          { scale: 1.5, opacity: 0, duration: 0.005 },
          { scale: 0, opacity: 0, duration: 1 },
          { scale: 1, opacity: 1, delay: 2 },
        ],
        ease: "power3.inOut",
      });
    });

    it("does not call gsap.to when bubbleRefs.current is null", () => {
      const refs = { current: null } as unknown as MutableRefObject<
        (HTMLDivElement | null)[]
      >;

      handleBubbleClick(refs, 0);

      expect(mockedTo).not.toHaveBeenCalled();
    });

    it("targets the correct element by index", () => {
      const el0 = document.createElement("div");
      const el1 = document.createElement("div");
      const refs = makeBubbleRefs([el0, el1]);

      handleBubbleClick(refs, 1);

      expect(mockedTo).toHaveBeenCalledWith(
        el1,
        expect.objectContaining({ ease: "power3.inOut" })
      );
    });
  });
});
