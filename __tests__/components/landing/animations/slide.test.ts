jest.mock("gsap", () => ({
  __esModule: true,
  gsap: {
    registerEffect: jest.fn(),
    fromTo: jest.fn(),
  },
}));

import { gsap } from "gsap";
import { registerSlideAnimation } from "@/components/landing/animations/slide";

const mockedRegisterEffect = gsap.registerEffect as jest.Mock;
const mockedFromTo = gsap.fromTo as jest.Mock;

describe("slide animation", () => {
  beforeEach(() => {
    mockedRegisterEffect.mockClear();
    mockedFromTo.mockClear();
  });

  it("calls gsap.registerEffect when registerSlideAnimation is invoked", () => {
    registerSlideAnimation();

    expect(mockedRegisterEffect).toHaveBeenCalledTimes(1);
  });

  it('registers an effect named "slide"', () => {
    registerSlideAnimation();

    const config = mockedRegisterEffect.mock.calls[0][0];
    expect(config.name).toBe("slide");
  });

  it("registers with extendTimeline set to true", () => {
    registerSlideAnimation();

    const config = mockedRegisterEffect.mock.calls[0][0];
    expect(config.extendTimeline).toBe(true);
  });

  describe("effect function", () => {
    function callEffect(
      direction: "left" | "right" | "top" | "bottom",
      location: "in" | "out",
      overrides?: { duration?: number; delay?: number; onComplete?: () => void }
    ) {
      registerSlideAnimation();

      const registered = mockedRegisterEffect.mock.calls[0][0];
      const targets = document.createElement("div");
      registered.effect(targets, {
        direction,
        location,
        duration: overrides?.duration ?? 1,
        delay: overrides?.delay,
        onComplete: overrides?.onComplete,
      });

      return { targets, fromToArgs: mockedFromTo.mock.calls[0] };
    }

    afterEach(() => {
      mockedRegisterEffect.mockClear();
      mockedFromTo.mockClear();
    });

    it("slides in from the left", () => {
      const { targets, fromToArgs } = callEffect("left", "in");
      const [target, from, to] = fromToArgs;

      expect(target).toBe(targets);
      expect(from.x).toBe("-100%");
      expect(from.y).toBe("0%");
      expect(to.x).toBe(0);
      expect(to.y).toBe(0);
    });

    it("slides in from the right", () => {
      const { fromToArgs } = callEffect("right", "in");
      const [, from, to] = fromToArgs;

      expect(from.x).toBe("100%");
      expect(to.x).toBe(0);
    });

    it("slides in from the top", () => {
      const { fromToArgs } = callEffect("top", "in");
      const [, from, to] = fromToArgs;

      expect(from.y).toBe("-100%");
      expect(from.x).toBe("0%");
      expect(to.y).toBe(0);
    });

    it("slides in from the bottom", () => {
      const { fromToArgs } = callEffect("bottom", "in");
      const [, from, to] = fromToArgs;

      expect(from.y).toBe("100%");
      expect(to.y).toBe(0);
    });

    it("slides out to the left", () => {
      const { fromToArgs } = callEffect("left", "out");
      const [, from, to] = fromToArgs;

      expect(from.x).toBe(0);
      expect(to.x).toBe("-100%");
    });

    it("slides out to the right", () => {
      const { fromToArgs } = callEffect("right", "out");
      const [, from, to] = fromToArgs;

      expect(from.x).toBe(0);
      expect(to.x).toBe("100%");
    });

    it("slides out to the top", () => {
      const { fromToArgs } = callEffect("top", "out");
      const [, from, to] = fromToArgs;

      expect(from.y).toBe(0);
      expect(to.y).toBe("-100%");
    });

    it("slides out to the bottom", () => {
      const { fromToArgs } = callEffect("bottom", "out");
      const [, from, to] = fromToArgs;

      expect(from.y).toBe(0);
      expect(to.y).toBe("100%");
    });

    it("uses default delay of 0 when not provided", () => {
      const { fromToArgs } = callEffect("left", "in");
      const [, , to] = fromToArgs;

      expect(to.delay).toBe(0);
    });

    it("passes custom delay when provided", () => {
      const { fromToArgs } = callEffect("left", "in", { delay: 2 });
      const [, , to] = fromToArgs;

      expect(to.delay).toBe(2);
    });

    it("uses provided duration", () => {
      const { fromToArgs } = callEffect("left", "in", { duration: 3 });
      const [, , to] = fromToArgs;

      expect(to.duration).toBe(3);
    });

    it("passes onComplete callback", () => {
      const onComplete = jest.fn();
      const { fromToArgs } = callEffect("left", "in", { onComplete });
      const [, , to] = fromToArgs;

      expect(to.onComplete).toBe(onComplete);
    });

    it("sets onComplete to undefined when not provided", () => {
      const { fromToArgs } = callEffect("left", "in");
      const [, , to] = fromToArgs;

      expect(to.onComplete).toBeUndefined();
    });
  });
});
