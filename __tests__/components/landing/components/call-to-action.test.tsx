import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

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
import { gsap } from "gsap";

describe("CallToAction", () => {
  it("renders without crashing", () => {
    const { container } = render(<CallToAction />);
    expect(container).toBeTruthy();
  });

  it("renders the call to action text", () => {
    render(<CallToAction />);
    expect(screen.getByText("callToAction")).toBeInTheDocument();
  });

  it("renders a button element", () => {
    render(<CallToAction />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders a ChevronDown icon (svg)", () => {
    const { container } = render(<CallToAction />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("sets up gsap scroll animation via useEffect", () => {
    render(<CallToAction />);
    expect(gsap.to).toHaveBeenCalled();
  });

  it("scrolls the page when the button is clicked", () => {
    const scrollBySpy = jest.fn();
    Object.defineProperty(window, "scrollBy", {
      value: scrollBySpy,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1000,
      writable: true,
    });

    render(<CallToAction />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(scrollBySpy).toHaveBeenCalledWith({
      top: 800,
      behavior: "smooth",
    });
  });
});
