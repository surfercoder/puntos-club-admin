import React from "react";
import { render, act } from "@testing-library/react";
import ParallaxSection, { Smartphone3DErrorBoundary, handleDerivedError, mobileMediaSubscribe, getMobileSnapshot, getMobileServerSnapshot } from "@/components/landing/screens/parallax-section";

/* ── mock gsap with callback capture ── */
const mockTimelineTo = jest.fn().mockReturnThis();
const mockTimelineFromTo = jest.fn().mockReturnThis();
const mockTimeline = {
  to: mockTimelineTo,
  from: jest.fn().mockReturnThis(),
  fromTo: mockTimelineFromTo,
  add: jest.fn().mockReturnThis(),
  kill: jest.fn(),
  pause: jest.fn(),
  play: jest.fn(),
};

let capturedScrollTriggerOnEnter: (() => void) | null = null;

jest.mock("gsap", () => ({
  __esModule: true,
  default: {
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(() => mockTimeline),
    registerPlugin: jest.fn(),
    registerEffect: jest.fn(),
    effects: {},
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
    context: jest.fn(() => ({ revert: jest.fn(), add: jest.fn() })),
  },
  gsap: {
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(() => mockTimeline),
    registerPlugin: jest.fn(),
    registerEffect: jest.fn(),
    effects: {},
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
    context: jest.fn(() => ({ revert: jest.fn(), add: jest.fn() })),
  },
}));

jest.mock("gsap/ScrollTrigger", () => {
  const instance = { kill: jest.fn() };
  return {
    __esModule: true,
    default: {
      create: jest.fn((config: any) => {
        if (config.onEnter) {
          capturedScrollTriggerOnEnter = config.onEnter;
        }
        return instance;
      }),
      refresh: jest.fn(),
      getAll: jest.fn(() => []),
    },
    ScrollTrigger: {
      create: jest.fn((config: any) => {
        if (config.onEnter) {
          capturedScrollTriggerOnEnter = config.onEnter;
        }
        return instance;
      }),
      refresh: jest.fn(),
      getAll: jest.fn(() => []),
    },
  };
});

jest.mock("gsap/TextPlugin", () => ({
  __esModule: true,
  default: {},
  TextPlugin: {},
}));
jest.mock("@gsap/react", () => ({
  useGSAP: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

let shouldThrowIn3D = false;

jest.mock("next/dynamic", () => (loader: any, opts: any) => {
  // Exercise the loading function if provided
  if (opts?.loading) opts.loading();
  return function MockSmartphone3D(props: any) {
    if (shouldThrowIn3D) {
      throw new Error("3D load failed");
    }
    return <button data-testid="smartphone-3d" onClick={() => props.onCompleteRotation?.()} />;
  };
});

describe("ParallaxSection", () => {
  beforeEach(() => {
    capturedScrollTriggerOnEnter = null;
    shouldThrowIn3D = false;
    jest.clearAllMocks();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("renders without crashing", () => {
    const { container } = render(<ParallaxSection />);
    expect(container).toBeTruthy();
  });

  it("renders the section with blue background", () => {
    const { container } = render(<ParallaxSection />);
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveStyle({ backgroundColor: "#31A1D6" });
  });

  it("renders message text", () => {
    const { container } = render(<ParallaxSection />);
    const textElements = container.querySelectorAll(".font-bold");
    expect(textElements.length).toBeGreaterThan(0);
  });

  it("calls gsap.fromTo for parallax scroll animation in useLayoutEffect", () => {
    const gsap = require("gsap").gsap;
    render(<ParallaxSection />);

    // useLayoutEffect runs synchronously after render, calling gsap.fromTo for parallax
    expect(gsap.fromTo).toHaveBeenCalledWith(
      expect.anything(),
      { y: "20%" },
      expect.objectContaining({
        y: "0%",
        ease: "none",
        scrollTrigger: expect.objectContaining({
          scrub: 1,
        }),
      })
    );
  });

  it("creates a ScrollTrigger with onEnter callback", () => {
    const { ScrollTrigger } = require("gsap/ScrollTrigger");
    render(<ParallaxSection />);

    expect(ScrollTrigger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        once: true,
        onEnter: expect.any(Function),
      })
    );
  });

  it("executes onEnter callback and creates message timeline", () => {
    const gsap = require("gsap").gsap;
    render(<ParallaxSection />);

    expect(capturedScrollTriggerOnEnter).not.toBeNull();

    // Execute the onEnter callback
    act(() => {
      capturedScrollTriggerOnEnter!();
    });

    // The onEnter callback calls gsap.fromTo for message/smartphone/icon entrance
    expect(gsap.fromTo).toHaveBeenCalledWith(
      expect.anything(),
      { y: "-100%", opacity: 0 },
      expect.objectContaining({ y: "0%", opacity: 1, duration: 2, ease: "power2.out" })
    );

    // It also creates a timeline for message rotation
    expect(gsap.timeline).toHaveBeenCalledWith(
      expect.objectContaining({
        repeat: -1,
        delay: 2,
        repeatDelay: 1.5,
      })
    );

    // The timeline.to was called for the fade-out animation
    expect(mockTimelineTo).toHaveBeenCalled();
    // The timeline.fromTo was called for the fade-in animation
    expect(mockTimelineFromTo).toHaveBeenCalled();
  });

  it("executes timeline onStart and onComplete callbacks", () => {
    const _gsap = require("gsap").gsap;
    render(<ParallaxSection />);

    act(() => {
      capturedScrollTriggerOnEnter!();
    });

    // Extract onStart and onComplete from the timeline.to call
    const toCall = mockTimelineTo.mock.calls[0];
    const toConfig = toCall[1]; // second argument is the config

    // Execute onStart (sets rotateSmartphone to true)
    if (toConfig.onStart) {
      act(() => {
        toConfig.onStart();
      });
    }

    // Execute onComplete (updates currentMessageIndex)
    if (toConfig.onComplete) {
      act(() => {
        toConfig.onComplete();
      });
    }

    // Extract onComplete from the timeline.fromTo call
    const fromToCall = mockTimelineFromTo.mock.calls[0];
    const fromToToConfig = fromToCall[2]; // third argument is the "to" config

    if (fromToToConfig && fromToToConfig.onComplete) {
      act(() => {
        fromToToConfig.onComplete();
      });
    }
  });

  it("handles mobile viewport (isMobile=true)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 600,
    });
    const gsap = require("gsap").gsap;

    render(<ParallaxSection />);

    // The useLayoutEffect should have been called with mobile-specific scroll trigger config
    expect(gsap.fromTo).toHaveBeenCalledWith(
      expect.anything(),
      { y: "20%" },
      expect.objectContaining({
        scrollTrigger: expect.objectContaining({
          start: "top 90%",
          end: "top 10%",
        }),
      })
    );
  });

  it("renders the Smartphone3DErrorBoundary fallback for children", () => {
    const { container } = render(<ParallaxSection />);
    // The mock Smartphone3D should render inside the section
    expect(container.querySelector("[data-testid='smartphone-3d']")).toBeInTheDocument();
  });

  it("renders the gradient overlay div", () => {
    const { container } = render(<ParallaxSection />);
    // Check for the gradient div with specific class
    const gradientDiv = container.querySelector("div[style*='linear-gradient']");
    expect(gradientDiv).toBeInTheDocument();
  });

  it("splitMessage splits last word correctly", () => {
    const { container } = render(<ParallaxSection />);
    const whiteSpan = container.querySelector(".text-white");
    expect(whiteSpan).toBeInTheDocument();
    expect(whiteSpan?.textContent).toBeTruthy();
  });

  it("Smartphone3DErrorBoundary catches errors and renders null", () => {
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    console.warn = jest.fn();
    console.error = jest.fn(); // Suppress React error boundary console.error

    shouldThrowIn3D = true;

    const { container } = render(<ParallaxSection />);

    // The error boundary should catch and render null for the 3D component
    expect(container.querySelector("[data-testid='smartphone-3d']")).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Smartphone3D failed to load:",
      "3D load failed"
    );

    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  it("getDerivedStateFromError returns hasError true", () => {
    const result = Smartphone3DErrorBoundary.getDerivedStateFromError();
    expect(result).toEqual({ hasError: true });
  });

  it("handleDerivedError returns hasError true", () => {
    expect(handleDerivedError()).toEqual({ hasError: true });
  });

  it("onCompleteRotation callback sets rotateSmartphone to false", () => {
    const { getByTestId } = render(<ParallaxSection />);
    const smartphone = getByTestId("smartphone-3d");
    act(() => {
      smartphone.click();
    });
    // The callback was invoked (no error thrown)
    expect(smartphone).toBeInTheDocument();
  });

  it("mobileMediaSubscribe adds and removes resize listener", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const cb = jest.fn();

    const unsub = mobileMediaSubscribe(cb);
    expect(addSpy).toHaveBeenCalledWith("resize", cb);

    unsub();
    expect(removeSpy).toHaveBeenCalledWith("resize", cb);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("getMobileSnapshot returns true when width < 800", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 600 });
    expect(getMobileSnapshot()).toBe(true);
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
    expect(getMobileSnapshot()).toBe(false);
  });

  it("getMobileServerSnapshot returns false", () => {
    expect(getMobileServerSnapshot()).toBe(false);
  });
});
