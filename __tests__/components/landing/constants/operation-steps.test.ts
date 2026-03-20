import { operationSteps } from "@/components/landing/constants/operation-steps";

describe("operationSteps", () => {
  it("exports an array", () => {
    expect(Array.isArray(operationSteps)).toBe(true);
  });

  it("contains multiple steps", () => {
    expect(operationSteps.length).toBeGreaterThan(0);
  });

  it("each step has darkColor, lightColor, and logo_url", () => {
    operationSteps.forEach((step) => {
      expect(step).toHaveProperty("darkColor");
      expect(step).toHaveProperty("lightColor");
      expect(step).toHaveProperty("logo_url");
      expect(typeof step.darkColor).toBe("string");
      expect(typeof step.lightColor).toBe("string");
      expect(typeof step.logo_url).toBe("string");
    });
  });

  it("colors are valid hex strings", () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    operationSteps.forEach((step) => {
      expect(step.darkColor).toMatch(hexPattern);
      expect(step.lightColor).toMatch(hexPattern);
    });
  });

  it("logo_url ends with .svg", () => {
    operationSteps.forEach((step) => {
      expect(step.logo_url).toMatch(/\.svg$/);
    });
  });
});
