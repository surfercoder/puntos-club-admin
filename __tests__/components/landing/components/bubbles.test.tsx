import React from "react";
import { render } from "@testing-library/react";

let capturedCallback: (() => void) | null = null;

const mockGsapTo = jest.fn();

jest.mock("gsap", () => ({
  __esModule: true,
  gsap: {
    to: (...args: unknown[]) => mockGsapTo(...args),
    from: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      kill: jest.fn(),
    })),
    registerPlugin: jest.fn(),
    registerEffect: jest.fn(),
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
  },
  default: {
    to: (...args: unknown[]) => mockGsapTo(...args),
    from: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      kill: jest.fn(),
    })),
    registerPlugin: jest.fn(),
    registerEffect: jest.fn(),
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
  },
}));

jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: { create: jest.fn(), refresh: jest.fn() },
  ScrollTrigger: { create: jest.fn(), refresh: jest.fn() },
}));

jest.mock("@gsap/react", () => ({
  __esModule: true,
  useGSAP: jest.fn((cb: () => void) => {
    capturedCallback = cb;
  }),
}));

jest.mock("@/components/landing/hooks/use-media-query", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@/components/landing/animations/bubble", () => ({
  handleBubbleClick: jest.fn(),
  handleMouseEnter: jest.fn(),
  handleMouseLeave: jest.fn(),
}));

import Bubbles from "@/components/landing/components/bubbles";

describe("Bubbles", () => {
  beforeEach(() => {
    capturedCallback = null;
    mockGsapTo.mockClear();
  });

  it("renders without crashing", () => {
    const { container } = render(
      <Bubbles index={0} backgroundColor="#FF0000" />
    );
    expect(container).toBeTruthy();
  });

  it("renders the correct number of bubble divs for index 0", () => {
    const { container } = render(
      <Bubbles index={0} backgroundColor="#FF0000" />
    );
    const bubbleDivs = container.querySelectorAll(".bubble");
    // bubbles[0] has 3 items
    expect(bubbleDivs).toHaveLength(3);
  });

  it("applies the backgroundColor style to each bubble", () => {
    const { container } = render(
      <Bubbles index={0} backgroundColor="#00FF00" />
    );
    const bubbleDivs = container.querySelectorAll(".bubble");
    bubbleDivs.forEach((div) => {
      expect((div as HTMLElement).style.backgroundColor).toBe(
        "rgb(0, 255, 0)"
      );
    });
  });

  it("renders bubbles for a different index", () => {
    const { container } = render(
      <Bubbles index={1} backgroundColor="#0000FF" />
    );
    const bubbleDivs = container.querySelectorAll(".bubble");
    // bubbles[1] has 4 items
    expect(bubbleDivs).toHaveLength(4);
  });

  describe("useGSAP scroll-triggered parallax animations", () => {
    it("calls gsap.to for each bubble with desktop distance (70) when window width >= 640", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<Bubbles index={0} backgroundColor="#FF0000" />);

      // Invoke the captured useGSAP callback after render so refs are populated
      expect(capturedCallback).not.toBeNull();
      capturedCallback!();

      // bubbles[0] has 3 items, so gsap.to should be called 3 times
      expect(mockGsapTo).toHaveBeenCalledTimes(3);

      // Each call should use y: -70 (desktop distance)
      for (let i = 0; i < 3; i++) {
        const callArgs = mockGsapTo.mock.calls[i];
        expect(callArgs[0]).toBeInstanceOf(HTMLDivElement);
        expect(callArgs[1]).toMatchObject({
          y: -70,
          delay: i * 0.3,
          scrollTrigger: expect.objectContaining({
            toggleActions: "play none none reverse",
            start: "top 100%",
            end: "top 0%",
            scrub: 1,
            refreshPriority: i,
          }),
        });
      }
    });

    it("uses distance 50 for small screens (window width < 640)", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 400,
      });

      render(<Bubbles index={0} backgroundColor="#FF0000" />);

      expect(capturedCallback).not.toBeNull();
      capturedCallback!();

      // bubbles[0] has 3 items
      expect(mockGsapTo).toHaveBeenCalledTimes(3);

      // Each call should use y: -50 (mobile distance)
      for (let i = 0; i < 3; i++) {
        const callArgs = mockGsapTo.mock.calls[i];
        expect(callArgs[1]).toMatchObject({
          y: -50,
          delay: i * 0.3,
        });
      }
    });

    it("calls gsap.to for each bubble when rendering index 1 (4 bubbles)", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<Bubbles index={1} backgroundColor="#0000FF" />);

      expect(capturedCallback).not.toBeNull();
      capturedCallback!();

      // bubbles[1] has 4 items
      expect(mockGsapTo).toHaveBeenCalledTimes(4);
    });

    it("sets the correct scrollTrigger trigger to the bubble element ref", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800,
      });

      const { container } = render(
        <Bubbles index={0} backgroundColor="#FF0000" />
      );

      expect(capturedCallback).not.toBeNull();
      capturedCallback!();

      const bubbleDivs = container.querySelectorAll(".bubble");

      for (let i = 0; i < bubbleDivs.length; i++) {
        const callArgs = mockGsapTo.mock.calls[i];
        // The first argument (target) should be the same DOM element
        expect(callArgs[0]).toBe(bubbleDivs[i]);
        // The scrollTrigger.trigger should also be the same element
        expect(callArgs[1].scrollTrigger.trigger).toBe(bubbleDivs[i]);
      }
    });
  });

  describe("event handlers", () => {
    it("calls handleMouseEnter on mouseEnter", () => {
      const { handleMouseEnter } = require("@/components/landing/animations/bubble");
      const { container } = render(
        <Bubbles index={0} backgroundColor="#FF0000" />
      );
      const { fireEvent } = require("@testing-library/react");
      const bubbleDivs = container.querySelectorAll(".bubble");
      fireEvent.mouseEnter(bubbleDivs[0]);
      expect(handleMouseEnter).toHaveBeenCalledWith(expect.any(Object), 0);
    });

    it("calls handleMouseLeave on mouseLeave", () => {
      const { handleMouseLeave } = require("@/components/landing/animations/bubble");
      const { container } = render(
        <Bubbles index={0} backgroundColor="#FF0000" />
      );
      const { fireEvent } = require("@testing-library/react");
      const bubbleDivs = container.querySelectorAll(".bubble");
      fireEvent.mouseLeave(bubbleDivs[1]);
      expect(handleMouseLeave).toHaveBeenCalledWith(expect.any(Object), 1);
    });

    it("calls handleBubbleClick on click", () => {
      const { handleBubbleClick } = require("@/components/landing/animations/bubble");
      const { container } = render(
        <Bubbles index={0} backgroundColor="#FF0000" />
      );
      const { fireEvent } = require("@testing-library/react");
      const bubbleDivs = container.querySelectorAll(".bubble");
      fireEvent.click(bubbleDivs[2]);
      expect(handleBubbleClick).toHaveBeenCalledWith(expect.any(Object), 2);
    });
  });

  describe("mobile sizing", () => {
    it("reduces size by 25 for large bubbles on mobile (isMobile=true)", () => {
      const useMediaQuery = require("@/components/landing/hooks/use-media-query").default;
      useMediaQuery.mockReturnValue(true);

      const { container } = render(
        <Bubbles index={0} backgroundColor="#FF0000" />
      );
      const bubbleDivs = container.querySelectorAll(".bubble");
      // bubbles[0][0].size = 65, which is >= 35, so on mobile: 65 - 25 = 40
      expect((bubbleDivs[0] as HTMLElement).style.width).toBe("40px");
      expect((bubbleDivs[0] as HTMLElement).style.height).toBe("40px");

      // bubbles[0][2].size = 36, which is >= 35, so on mobile: 36 - 25 = 11
      expect((bubbleDivs[2] as HTMLElement).style.width).toBe("11px");
      expect((bubbleDivs[2] as HTMLElement).style.height).toBe("11px");

      useMediaQuery.mockReturnValue(false);
    });

    it("keeps original size for small bubbles on mobile (size < 35)", () => {
      const useMediaQuery = require("@/components/landing/hooks/use-media-query").default;
      useMediaQuery.mockReturnValue(true);

      // index 1 has a bubble with size 31 (< 35)
      const { container } = render(
        <Bubbles index={1} backgroundColor="#0000FF" />
      );
      const bubbleDivs = container.querySelectorAll(".bubble");
      // bubbles[1][2].size = 31 which is < 35, so it stays 31 on mobile
      expect((bubbleDivs[2] as HTMLElement).style.width).toBe("31px");

      useMediaQuery.mockReturnValue(false);
    });
  });
});
