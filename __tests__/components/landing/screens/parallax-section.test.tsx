import React from "react";
import { render, act } from "@testing-library/react";
import ParallaxSection from "@/components/landing/screens/parallax-section";

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

jest.mock("next/dynamic", () => () => {
  return function MockSmartphone3D() {
    return <div data-testid="smartphone-3d" />;
  };
});

describe("ParallaxSection", () => {
  beforeEach(() => {
    capturedScrollTriggerOnEnter = null;
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
});
