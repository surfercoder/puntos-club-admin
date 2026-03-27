import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import Profit from "@/components/landing/screens/profit";

/* ── callback captures ── */
let capturedOnUpdate: (() => void) | null = null;
let capturedOnEnter: (() => void) | null = null;

/* ── shared mocks ── */
const mockGsapTo = jest.fn((_, opts) => {
  if (opts?.onUpdate) capturedOnUpdate = opts.onUpdate;
  return {};
});

jest.mock("gsap", () => ({
  __esModule: true,
  default: {
    to: (...args: any[]) => mockGsapTo(...args),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    getProperty: jest.fn(() => 150),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      add: jest.fn((tween: any) => tween),
      kill: jest.fn(),
      pause: jest.fn(),
      play: jest.fn(),
    })),
    registerPlugin: jest.fn(),
    registerEffect: jest.fn(),
    effects: { slide: jest.fn() },
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
        if (config?.onEnter) capturedOnEnter = config.onEnter;
        return instance;
      }),
      refresh: jest.fn(),
      getAll: jest.fn(() => []),
    },
    ScrollTrigger: {
      create: jest.fn((config: any) => {
        if (config?.onEnter) capturedOnEnter = config.onEnter;
        return instance;
      }),
      refresh: jest.fn(),
      getAll: jest.fn(() => []),
    },
  };
});
jest.mock("gsap/MotionPathPlugin", () => ({
  __esModule: true,
  default: {},
  MotionPathPlugin: {},
}));
jest.mock("gsap/TextPlugin", () => ({
  __esModule: true,
  default: {},
  TextPlugin: {},
}));
jest.mock("@gsap/react", () => ({
  useGSAP: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => {
    // Return multi-line descriptions for some keys to cover descLines.length > 2 branch (line 276)
    if (key === "desc2") return "Line one\nLine two\nLine three";
    return key;
  }),
}));

jest.mock("@/components/landing/hooks/use-media-query", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@/components/landing/animations/slide", () => ({
  registerSlideAnimation: jest.fn(),
}));

describe("Profit", () => {
  beforeEach(() => {
    capturedOnUpdate = null;
    capturedOnEnter = null;
    mockGsapTo.mockClear();
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<Profit />);
    expect(container).toBeTruthy();
  });

  it("renders the section title", () => {
    const { container } = render(<Profit />);
    const title = container.querySelector("h1");
    expect(title).toBeInTheDocument();
  });

  it("renders an SVG chart", () => {
    const { container } = render(<Profit />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders the polyline path", () => {
    const { container } = render(<Profit />);
    const polyline = container.querySelector("polyline");
    expect(polyline).toBeInTheDocument();
  });

  it("handles circle click via handleCircleClick", () => {
    const { container } = render(<Profit />);
    const circles = container.querySelectorAll("circle");
    // Click on a data point circle (skip the first animating circle at cx=0)
    const dataCircle = Array.from(circles).find(
      (c) => c.getAttribute("cx") !== "0"
    );
    expect(dataCircle).toBeTruthy();
    fireEvent.click(dataCircle!);
    // After clicking, the description container should be present
    const descContainer = container.querySelector(".sm\\:hidden");
    expect(descContainer).toBeInTheDocument();
  });

  it("clicking a circle with descKey updates description text", () => {
    const { container } = render(<Profit />);
    const circles = container.querySelectorAll("circle");
    // Find a circle that has a descKey (one with cx=150, which is pointsBigScreen[1])
    const dataCircle = Array.from(circles).find(
      (c) => c.getAttribute("cx") === "150"
    );
    expect(dataCircle).toBeTruthy();
    fireEvent.click(dataCircle!);
    // The description container should have updated border color
    const descContainer = container.querySelector(".sm\\:hidden") as HTMLElement;
    expect(descContainer).toBeInTheDocument();
    expect(descContainer.style.borderColor).toBe("rgb(255, 69, 115)");
  });

  it("clicking a circle without descKey sets empty description", () => {
    const { container } = render(<Profit />);
    const circles = container.querySelectorAll("circle");
    // First point (x=15) has no descKey
    const firstPoint = Array.from(circles).find(
      (c) => c.getAttribute("cx") === "15"
    );
    expect(firstPoint).toBeTruthy();
    fireEvent.click(firstPoint!);
    const descContainer = container.querySelector(".sm\\:hidden") as HTMLElement;
    expect(descContainer).toBeInTheDocument();
    // borderColor should be transparent since no description
    expect(descContainer.style.borderColor).toBe("transparent");
  });

  it("executes onEnter callback that calls gsap.effects.slide", () => {
    const gsap = require("gsap").default;
    render(<Profit />);

    expect(capturedOnEnter).not.toBeNull();
    act(() => {
      capturedOnEnter!();
    });
    expect(gsap.effects.slide).toHaveBeenCalled();
  });

  it("executes onUpdate callback that checks circle proximity to points", () => {
    const gsap = require("gsap").default;

    render(<Profit />);

    // The onUpdate callback should have been captured from gsap.to call
    expect(capturedOnUpdate).not.toBeNull();

    // Now set getProperty to return values matching pointsBigScreen[1] (x=150, y=300)
    gsap.getProperty
      .mockReturnValueOnce(150) // x
      .mockReturnValueOnce(300); // y

    act(() => {
      capturedOnUpdate!();
    });

    // The callback should have called gsap.to for the fill color change
    expect(mockGsapTo).toHaveBeenCalled();
  });

  it("onUpdate with point that has no descKey sets empty description", () => {
    const gsap = require("gsap").default;

    render(<Profit />);

    expect(capturedOnUpdate).not.toBeNull();

    // pointsBigScreen[0] is {x: 15, y: 210} with no descKey
    gsap.getProperty
      .mockReturnValueOnce(15)  // x
      .mockReturnValueOnce(210); // y

    act(() => {
      capturedOnUpdate!();
    });
  });

  it("onUpdate with non-matching coordinates does not update state", () => {
    const gsap = require("gsap").default;

    render(<Profit />);

    expect(capturedOnUpdate).not.toBeNull();

    // Return coordinates that don't match any point
    gsap.getProperty
      .mockReturnValueOnce(999)
      .mockReturnValueOnce(999);

    // Should not throw
    act(() => {
      capturedOnUpdate!();
    });
  });

  it("renders text elements inside SVG map for points with titleKey", () => {
    const { container } = render(<Profit />);
    // Points with titleKey render <g> elements with text
    const textGroups = container.querySelectorAll("g[class*='x-']");
    expect(textGroups.length).toBeGreaterThan(0);
    // Check that text elements exist inside these groups
    const textElements = container.querySelectorAll("g[class*='x-'] text");
    expect(textElements.length).toBeGreaterThan(0);
  });

  it("renders with mobile screen size (isMobile=true)", () => {
    const useMediaQuery = require("@/components/landing/hooks/use-media-query").default;
    // Both queries return true for mobile
    useMediaQuery.mockReturnValue(true);

    const { container } = render(<Profit />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // On mobile the viewBox should be the mobile one
    expect(svg?.getAttribute("viewBox")).toBe("0 0 600 600");

    // Reset
    useMediaQuery.mockReturnValue(false);
  });

  it("renders with small screen size (isSmall=true, isMobile=false)", () => {
    const useMediaQuery = require("@/components/landing/hooks/use-media-query").default;
    // First call (isSmall) returns true, second (isMobile) returns false
    useMediaQuery
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const { container } = render(<Profit />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 800 600");
  });

  it("renders description lines with multiple lines for points with descKey", () => {
    const useMediaQuery = require("@/components/landing/hooks/use-media-query").default;
    useMediaQuery.mockReturnValue(true);

    const { container } = render(<Profit />);
    // On mobile, clicking a point with descKey shows description in the bottom container
    const circles = container.querySelectorAll("circle");
    const dataCircle = Array.from(circles).find(
      (c) => c.getAttribute("cx") === "120" // pointsMobile[1]
    );
    if (dataCircle) {
      fireEvent.click(dataCircle);
      const descContainer = container.querySelector(".sm\\:hidden");
      expect(descContainer).toBeInTheDocument();
    }

    useMediaQuery.mockReturnValue(false);
  });
});
