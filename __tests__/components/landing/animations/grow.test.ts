jest.mock("gsap", () => ({
  __esModule: true,
  gsap: {
    registerEffect: jest.fn(),
    fromTo: jest.fn(),
  },
}));

import { gsap } from "gsap";
import { registerGrowAnimation } from "@/components/landing/animations/grow";

const mockedRegisterEffect = gsap.registerEffect as jest.Mock;
const mockedFromTo = gsap.fromTo as jest.Mock;

describe("grow animation", () => {
  beforeEach(() => {
    mockedRegisterEffect.mockClear();
    mockedFromTo.mockClear();
  });

  it("calls gsap.registerEffect when registerGrowAnimation is invoked", () => {
    registerGrowAnimation();

    expect(mockedRegisterEffect).toHaveBeenCalledTimes(1);
  });

  it('registers an effect named "grow"', () => {
    registerGrowAnimation();

    const config = mockedRegisterEffect.mock.calls[0][0];
    expect(config.name).toBe("grow");
  });

  it("registers with extendTimeline set to true", () => {
    registerGrowAnimation();

    const config = mockedRegisterEffect.mock.calls[0][0];
    expect(config.extendTimeline).toBe(true);
  });

  describe("effect function", () => {
    it("calls gsap.fromTo with scale 0 to scale 1", () => {
      registerGrowAnimation();

      const config = mockedRegisterEffect.mock.calls[0][0];
      const targets = document.createElement("div");
      config.effect(targets, { delay: 0.5 });

      expect(mockedFromTo).toHaveBeenCalledWith(
        targets,
        { scale: 0 },
        { scale: 1, duration: 2, delay: 0.5 }
      );
    });

    it("defaults delay to 0 when config is undefined", () => {
      registerGrowAnimation();

      const config = mockedRegisterEffect.mock.calls[0][0];
      const targets = document.createElement("div");
      config.effect(targets, undefined);

      expect(mockedFromTo).toHaveBeenCalledWith(
        targets,
        { scale: 0 },
        { scale: 1, duration: 2, delay: 0 }
      );
    });
  });
});
