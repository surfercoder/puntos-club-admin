import React from "react";
import { render, screen } from "@testing-library/react";

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
});
