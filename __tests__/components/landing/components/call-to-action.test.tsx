import React from "react";
import { render, screen, act } from "@testing-library/react";

jest.mock("gsap", () => ({
  __esModule: true,
  gsap: {
    to: jest.fn(),
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
    to: jest.fn(),
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
  useGSAP: jest.fn((cb) => {
    if (typeof cb === "function") cb();
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

import { CallToAction } from "@/components/landing/components/call-to-action";

describe("CallToAction", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders without crashing", () => {
    const { container } = render(<CallToAction />);
    expect(container).toBeTruthy();
  });

  it("renders the call to action text", () => {
    render(<CallToAction />);
    expect(screen.getByText("callToAction")).toBeInTheDocument();
  });

  it("renders three chevron elements", () => {
    const { container } = render(<CallToAction />);
    // The component renders 3 chevron wrapper divs each containing a rotated div
    const chevrons = container.querySelectorAll(".rotate-45");
    expect(chevrons).toHaveLength(3);
  });

  it("cycles chevron colors via setInterval", () => {
    const { container } = render(<CallToAction />);

    // Capture initial border colors
    const getChevronColors = () => {
      const chevrons = container.querySelectorAll(".rotate-45");
      return Array.from(chevrons).map(
        (el) => (el as HTMLElement).style.borderColor
      );
    };

    const initialColors = getChevronColors();

    // Advance time to trigger the interval callback (interval is 500ms)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    const updatedColors = getChevronColors();
    // The colors should have shifted after the interval fires
    expect(updatedColors).not.toEqual(initialColors);
  });

  it("cycles colors multiple times", () => {
    const { container } = render(<CallToAction />);

    const getChevronColors = () => {
      const chevrons = container.querySelectorAll(".rotate-45");
      return Array.from(chevrons).map(
        (el) => (el as HTMLElement).style.borderColor
      );
    };

    // Advance through multiple intervals
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    const colors = getChevronColors();
    // Colors should still be valid (3 chevrons with colors)
    expect(colors).toHaveLength(3);
    colors.forEach((color) => {
      expect(color).toBeTruthy();
    });
  });
});
