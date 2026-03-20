import React from "react";
import { render } from "@testing-library/react";
import Loader from "@/components/landing/screens/loader";

/* ── shared mocks ── */
jest.mock("gsap", () => {
  const to = jest.fn((target: any, config: any) => {
    if (config?.onComplete) config.onComplete();
    return { kill: jest.fn() };
  });
  // Store reference so tests can access it
  (globalThis as any).__mockGsapTo = to;
  return {
    __esModule: true,
    default: { to, registerPlugin: jest.fn() },
    gsap: { to, registerPlugin: jest.fn() },
  };
});
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

jest.mock("@/components/landing/components/gift-svg", () => ({
  Gift: (props: any) => <div data-testid="gift-svg" {...props} />,
}));

describe("Loader", () => {
  const onAnimationEnd = jest.fn();
  let gsapTo: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    gsapTo = (globalThis as any).__mockGsapTo;

    // Mock document.getElementById to return mock elements
    const mockElement = {
      style: {},
      textContent: "Test slogan",
    } as unknown as HTMLElement;

    jest.spyOn(document, "getElementById").mockImplementation((id: string) => {
      if (id === "slogan-text") {
        return { ...mockElement, textContent: "Test slogan" } as unknown as HTMLElement;
      }
      return mockElement;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<Loader onAnimationEnd={onAnimationEnd} />);
    expect(container).toBeTruthy();
  });

  it("renders the background element", () => {
    const { container } = render(<Loader onAnimationEnd={onAnimationEnd} />);
    expect(container.querySelector("#bg")).toBeInTheDocument();
  });

  it("renders the title", () => {
    const { container } = render(<Loader onAnimationEnd={onAnimationEnd} />);
    expect(container.querySelector("#title")).toBeInTheDocument();
  });

  it("renders the Gift component", () => {
    const { getByTestId } = render(<Loader onAnimationEnd={onAnimationEnd} />);
    expect(getByTestId("gift-svg")).toBeInTheDocument();
  });

  it("executes the full animation chain and calls onAnimationEnd", () => {
    render(<Loader onAnimationEnd={onAnimationEnd} />);

    // The mock gsap.to executes onComplete synchronously, so the entire
    // nested chain should have executed, ultimately calling onAnimationEnd
    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it("sets document.body.style.overflow to hidden at start and restores at end", () => {
    document.body.style.overflow = "";
    render(<Loader onAnimationEnd={onAnimationEnd} />);

    // The animation chain sets overflow hidden first, then overflowY/overflowX at the end
    expect(document.body.style.overflowY).toBe("auto");
    expect(document.body.style.overflowX).toBe("hidden");
  });

  it("calls gsap.to multiple times for the animation chain", () => {
    render(<Loader onAnimationEnd={onAnimationEnd} />);

    // The animation chain has 6 nested gsap.to calls
    expect(gsapTo.mock.calls.length).toBeGreaterThanOrEqual(6);
  });
});
