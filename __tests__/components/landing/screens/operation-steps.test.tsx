import React from "react";
import { render } from "@testing-library/react";
import OperationSteps from "@/components/landing/screens/operation-steps";

/* ── shared mocks ── */
jest.mock("gsap", () => {
  const to = jest.fn();
  const mock = {
    to,
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
    effects: {
      grow: jest.fn(),
      slide: jest.fn(),
    },
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
    context: jest.fn(() => ({ revert: jest.fn(), add: jest.fn() })),
  };
  (globalThis as any).__mockGsap = mock;
  return { __esModule: true, default: mock, gsap: mock };
});

jest.mock("gsap/ScrollTrigger", () => {
  const create = jest.fn((config: any) => {
    if (config.onEnter) config.onEnter();
    if (config.onLeaveBack) config.onLeaveBack();
    return { kill: jest.fn() };
  });
  (globalThis as any).__mockScrollTriggerCreate = create;
  return {
    __esModule: true,
    default: { create, refresh: jest.fn(), getAll: jest.fn(() => []) },
    ScrollTrigger: { create, refresh: jest.fn(), getAll: jest.fn(() => []) },
  };
});

jest.mock("gsap/TextPlugin", () => ({
  __esModule: true,
  default: {},
  TextPlugin: {},
}));

jest.mock("@gsap/react", () => {
  const React = require("react");
  return {
    useGSAP: jest.fn((callback: Function) => {
      React.useEffect(() => {
        if (typeof callback === "function") callback();
      }, []);
    }),
  };
});

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => {
    // Some steps get newlines (covers React.Fragment branch), others don't (covers plain content branch)
    if (key.endsWith(".content")) {
      const stepIndex = parseInt(key.charAt(0), 10);
      return stepIndex % 2 === 0 ? "Line1\nLine2" : "Single line content";
    }
    if (key.endsWith(".highlightedWord")) return "highlight";
    if (key.endsWith(".title")) return "Test highlight title";
    return key;
  }),
}));

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({ resolvedTheme: "light" })),
}));

jest.mock("@/components/landing/hooks/use-media-query", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@/components/landing/animations/slide", () => ({
  registerSlideAnimation: jest.fn(),
}));

jest.mock("@/components/landing/animations/grow", () => ({
  registerGrowAnimation: jest.fn(),
}));

jest.mock("@/components/landing/animations/bubble", () => ({
  handleBubbleClick: jest.fn(),
  handleMouseEnter: jest.fn(),
  handleMouseLeave: jest.fn(),
}));

jest.mock("@/components/landing/components/bubbles", () => ({
  __esModule: true,
  default: () => <div data-testid="bubbles" />,
}));

jest.mock("@/components/landing/components/gift-svg", () => ({
  Gift: (props: any) => <div data-testid="gift-svg" {...props} />,
}));

jest.mock("@/components/landing/styles/operation-steps.css", () => ({}));

describe("OperationSteps", () => {
  let mockGsap: any;
  let mockScrollTriggerCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGsap = (globalThis as any).__mockGsap;
    mockScrollTriggerCreate = (globalThis as any).__mockScrollTriggerCreate;
  });

  it("renders without crashing", () => {
    const { container } = render(<OperationSteps />);
    expect(container).toBeTruthy();
  });

  it("renders step numbers", () => {
    const { container } = render(<OperationSteps />);
    const stepElements = container.querySelectorAll(".rounded-full");
    expect(stepElements.length).toBeGreaterThan(0);
  });

  it("renders the Gift component", () => {
    const { getByTestId } = render(<OperationSteps />);
    expect(getByTestId("gift-svg")).toBeInTheDocument();
  });

  it("executes useGSAP callback and creates ScrollTrigger instances", () => {
    render(<OperationSteps />);
    expect(mockScrollTriggerCreate).toHaveBeenCalled();
  });

  it("triggers gsap effects on ScrollTrigger onEnter", () => {
    render(<OperationSteps />);
    expect(mockGsap.effects.grow).toHaveBeenCalled();
    expect(mockGsap.effects.slide).toHaveBeenCalled();
  });

  it("triggers gsap.to on ScrollTrigger onLeaveBack", () => {
    render(<OperationSteps />);
    expect(mockGsap.to).toHaveBeenCalled();
  });

  it("renders content with line breaks when translation contains newlines", () => {
    const { container } = render(<OperationSteps />);
    const brElements = container.querySelectorAll("br");
    expect(brElements.length).toBeGreaterThan(0);
  });

  it("highlights the correct word in titles", () => {
    const { container } = render(<OperationSteps />);
    const spans = container.querySelectorAll("h3 span");
    expect(spans.length).toBeGreaterThan(0);
  });
});
