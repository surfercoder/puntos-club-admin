import React from "react";
import { render } from "@testing-library/react";
import WeDo from "@/components/landing/screens/we-do";

/* ── shared mocks ── */
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
  useGSAP: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

jest.mock("@/components/landing/styles/we-do.css", () => ({}));

describe("WeDo", () => {
  it("renders without crashing", () => {
    const { container } = render(<WeDo />);
    expect(container).toBeTruthy();
  });

  it("renders the title heading", () => {
    const { container } = render(<WeDo />);
    const heading = container.querySelector("h1");
    expect(heading).toBeInTheDocument();
  });

  it("renders the description paragraph", () => {
    const { container } = render(<WeDo />);
    const paragraph = container.querySelector("p");
    expect(paragraph).toBeInTheDocument();
  });

  it("has the we-do-container class", () => {
    const { container } = render(<WeDo />);
    expect(container.querySelector(".we-do-container")).toBeInTheDocument();
  });
});
