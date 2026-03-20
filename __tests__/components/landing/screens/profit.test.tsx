import React from "react";
import { render } from "@testing-library/react";
import Profit from "@/components/landing/screens/profit";

/* ── shared mocks ── */
jest.mock("gsap", () => ({
  __esModule: true,
  default: {
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    getProperty: jest.fn(() => 0),
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
    effects: { slide: jest.fn() },
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
    context: jest.fn(() => ({ revert: jest.fn(), add: jest.fn() })),
  },
}));
jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: { create: jest.fn(), refresh: jest.fn(), getAll: jest.fn(() => []) },
  ScrollTrigger: { create: jest.fn(), refresh: jest.fn(), getAll: jest.fn(() => []) },
}));
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
  useTranslations: jest.fn(() => (key: string) => key),
}));

jest.mock("@/components/landing/hooks/use-media-query", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@/components/landing/animations/slide", () => ({
  registerSlideAnimation: jest.fn(),
}));

describe("Profit", () => {
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
});
