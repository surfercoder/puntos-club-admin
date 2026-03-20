import React from "react";
import { render } from "@testing-library/react";
import Engines from "@/components/landing/screens/engines";

/* ── capture useGSAP callback ── */
let capturedGSAPCallback: (() => void) | null = null;

jest.mock("gsap", () => ({
  __esModule: true,
  default: {
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      kill: jest.fn(),
      pause: jest.fn(),
      play: jest.fn(),
    })),
    registerPlugin: jest.fn(),
    registerEffect: jest.fn(),
    effects: {},
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
    context: jest.fn(() => ({ revert: jest.fn(), add: jest.fn() })),
  },
}));
jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: { create: jest.fn(), refresh: jest.fn(), getAll: jest.fn(() => []) },
  ScrollTrigger: { create: jest.fn(), refresh: jest.fn(), getAll: jest.fn(() => []) },
}));
jest.mock("gsap/TextPlugin", () => ({
  __esModule: true,
  default: {},
  TextPlugin: {},
}));
jest.mock("@gsap/react", () => ({
  useGSAP: jest.fn((cb: () => void) => {
    capturedGSAPCallback = cb;
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

describe("Engines", () => {
  beforeEach(() => {
    capturedGSAPCallback = null;
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<Engines />);
    expect(container.querySelector(".landing-engines-container")).toBeInTheDocument();
  });

  it("renders engine images", () => {
    const { container } = render(<Engines />);
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(0);
  });

  it("renders the title", () => {
    render(<Engines />);
    const heading = document.querySelector("h1");
    expect(heading).toBeInTheDocument();
  });

  it("executes useGSAP callback and runs GSAP animations", () => {
    const gsap = require("gsap").default;

    const { container } = render(<Engines />);

    // The callback should have been captured
    expect(capturedGSAPCallback).not.toBeNull();

    // Execute the captured GSAP callback
    capturedGSAPCallback!();

    // Verify gsap.fromTo was called for the ".landing-go-down" animation
    expect(gsap.fromTo).toHaveBeenCalledWith(
      ".landing-go-down",
      { y: "-100%" },
      expect.objectContaining({
        y: 0,
        duration: 1,
        delay: 1,
        ease: "power1.inOut",
        scrollTrigger: expect.objectContaining({
          trigger: ".landing-go-down",
          start: "bottom 80%",
        }),
      })
    );

    // Verify gsap.to was called for engine rotation animations
    // (querySelectorAll(".landing-engine") returns the engine images in the DOM)
    const engineElements = container.querySelectorAll(".landing-engine");
    expect(engineElements.length).toBeGreaterThan(0);
    expect(gsap.to).toHaveBeenCalled();
  });

  it("animates left and right engines with correct rotation", () => {
    const gsap = require("gsap").default;

    render(<Engines />);
    capturedGSAPCallback!();

    // gsap.to is called for each engine element
    const toCalls = gsap.to.mock.calls;
    const engineCalls = toCalls.filter(
      (call: any[]) => call[1] && call[1].rotate !== undefined
    );
    expect(engineCalls.length).toBeGreaterThan(0);

    // Check that left engines get negative rotation and right engines get positive
    const hasNegativeRotation = engineCalls.some(
      (call: any[]) => call[1].rotate < 0
    );
    const hasPositiveRotation = engineCalls.some(
      (call: any[]) => call[1].rotate > 0
    );
    expect(hasNegativeRotation).toBe(true);
    expect(hasPositiveRotation).toBe(true);
  });

  it("animates text elements with fromTo for slide-in effect", () => {
    const gsap = require("gsap").default;

    render(<Engines />);
    capturedGSAPCallback!();

    // gsap.fromTo is called for ".landing-go-down" and for each ".landing-text" element
    const fromToCalls = gsap.fromTo.mock.calls;
    expect(fromToCalls.length).toBeGreaterThanOrEqual(1);

    // The text animations use x offset and opacity
    const textAnimations = fromToCalls.filter(
      (call: any[]) => call[1] && call[1].opacity === 0
    );
    expect(textAnimations.length).toBeGreaterThan(0);
  });
});
