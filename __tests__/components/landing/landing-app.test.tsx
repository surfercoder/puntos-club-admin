import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import { LandingApp } from "@/components/landing/landing-app";

/* ── shared mocks ── */
jest.mock("gsap", () => {
  const toMock = jest.fn((_target: unknown, config: Record<string, unknown>) => {
    if (typeof config?.onComplete === "function") {
      (config.onComplete as () => void)();
    }
  });

  const makeGsapObj = () => ({
    to: toMock,
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
    effects: { slide: jest.fn() },
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
    context: jest.fn(() => ({ revert: jest.fn(), add: jest.fn() })),
  });

  return {
    __esModule: true,
    default: makeGsapObj(),
    gsap: makeGsapObj(),
  };
});
jest.mock("gsap/ScrollTrigger", () => {
  const instance = { kill: jest.fn() };
  const createFn = jest.fn((config: Record<string, unknown>) => {
    // Invoke onEnter callback if provided, so the code inside is covered
    if (typeof config?.onEnter === "function") {
      (config.onEnter as () => void)();
    }
    return instance;
  });
  return {
    __esModule: true,
    default: { create: createFn, refresh: jest.fn(), getAll: jest.fn(() => []) },
    ScrollTrigger: { create: createFn, refresh: jest.fn(), getAll: jest.fn(() => []) },
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

/* ── Mock all child screen components ── */
jest.mock("@/components/landing/screens/contact-form", () => ({
  __esModule: true,
  default: ({ circleRefs }: { circleRefs: React.MutableRefObject<(HTMLDivElement | null)[]> }) => {
    return (
      <div data-testid="contact-form" ref={(el) => {
        // Populate circleRefs so the forEach loop body in onComplete is covered
        if (el && circleRefs.current.length === 0) {
          circleRefs.current = [el];
        }
      }} />
    );
  },
}));

jest.mock("@/components/landing/screens/operation-steps", () => ({
  __esModule: true,
  default: () => <div data-testid="operation-steps" />,
}));

jest.mock("@/components/landing/screens/profit", () => ({
  __esModule: true,
  default: () => <div data-testid="profit" />,
}));

jest.mock("@/components/landing/screens/we-do", () => ({
  __esModule: true,
  default: () => <div data-testid="we-do" />,
}));

jest.mock("@/components/landing/screens/engines", () => ({
  __esModule: true,
  default: () => <div data-testid="engines" />,
}));

jest.mock("@/components/landing/screens/parallax-section", () => ({
  __esModule: true,
  default: () => <div data-testid="parallax-section" />,
}));

jest.mock("@/components/landing/components/footer", () => ({
  __esModule: true,
  default: () => <div data-testid="footer" />,
}));

jest.mock("@/components/landing/components/call-to-action", () => ({
  CallToAction: () => <div data-testid="call-to-action" />,
}));

jest.mock("@/components/landing/animations/slide", () => ({
  registerSlideAnimation: jest.fn(),
}));

/* ── Loader mock: default version does NOT call onAnimationEnd ── */
let loaderAutoFire = false;
jest.mock("@/components/landing/screens/loader", () => ({
  __esModule: true,
  default: ({ onAnimationEnd }: { onAnimationEnd: () => void }) => {
    React.useEffect(() => {
      if (loaderAutoFire) {
        onAnimationEnd();
      }
    }, [onAnimationEnd]);
    return <div data-testid="loader" onClick={onAnimationEnd} />;
  },
}));

describe("LandingApp", () => {
  beforeEach(() => {
    loaderAutoFire = false;
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<LandingApp />);
    expect(container).toBeTruthy();
  });

  it("renders the Loader component", () => {
    const { getByTestId } = render(<LandingApp />);
    expect(getByTestId("loader")).toBeInTheDocument();
  });

  it("does not render content sections before animation completes", () => {
    const { queryByTestId } = render(<LandingApp />);
    expect(queryByTestId("we-do")).not.toBeInTheDocument();
    expect(queryByTestId("operation-steps")).not.toBeInTheDocument();
    expect(queryByTestId("engines")).not.toBeInTheDocument();
    expect(queryByTestId("profit")).not.toBeInTheDocument();
    expect(queryByTestId("contact-form")).not.toBeInTheDocument();
    expect(queryByTestId("footer")).not.toBeInTheDocument();
  });

  it("shows loader wrapper with opacity-100 before animation completes", () => {
    const { getByTestId } = render(<LandingApp />);
    const loaderWrapper = getByTestId("loader").parentElement;
    expect(loaderWrapper?.className).toContain("opacity-100");
    expect(loaderWrapper?.className).not.toContain("pointer-events-none");
  });

  describe("after animation completes", () => {
    beforeEach(() => {
      loaderAutoFire = true;
    });

    it("renders all content sections when onAnimationEnd is called", async () => {
      let result: ReturnType<typeof render>;
      await act(async () => {
        result = render(<LandingApp />);
      });

      await waitFor(() => {
        expect(result.getByTestId("call-to-action")).toBeInTheDocument();
      });

      expect(result!.getByTestId("parallax-section")).toBeInTheDocument();
      expect(result!.getByTestId("we-do")).toBeInTheDocument();
      expect(result!.getByTestId("operation-steps")).toBeInTheDocument();
      expect(result!.getByTestId("engines")).toBeInTheDocument();
      expect(result!.getByTestId("profit")).toBeInTheDocument();
      expect(result!.getByTestId("contact-form")).toBeInTheDocument();
      expect(result!.getByTestId("footer")).toBeInTheDocument();
    });

    it("applies opacity-0 and pointer-events-none to loader wrapper when animation completes", async () => {
      let result: ReturnType<typeof render>;
      await act(async () => {
        result = render(<LandingApp />);
      });

      await waitFor(() => {
        const loaderWrapper = result.getByTestId("loader").parentElement;
        expect(loaderWrapper?.className).toContain("opacity-0");
        expect(loaderWrapper?.className).toContain("pointer-events-none");
      });
    });

    it("invokes ScrollTrigger.create and gsap.to for scroll animations", async () => {
      const { ScrollTrigger } = jest.requireMock("gsap/ScrollTrigger");
      const { gsap: gsapMock } = jest.requireMock("gsap");

      await act(async () => {
        render(<LandingApp />);
      });

      await waitFor(() => {
        // The useEffect that runs when animationComplete=true should have
        // called ScrollTrigger.create and gsap.to for the various refs
        expect(ScrollTrigger.create).toHaveBeenCalled();
        expect(gsapMock.to).toHaveBeenCalled();
      });
    });
  });
});
