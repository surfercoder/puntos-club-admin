import { bubbles } from "@/components/landing/constants/bubbles";

describe("bubbles", () => {
  it("exports an array", () => {
    expect(Array.isArray(bubbles)).toBe(true);
  });

  it("contains multiple bubble sets", () => {
    expect(bubbles.length).toBeGreaterThan(0);
  });

  it("each set is an array of bubble configs with position data", () => {
    bubbles.forEach((set) => {
      expect(Array.isArray(set)).toBe(true);
      set.forEach((b) => {
        expect(b).toHaveProperty("top");
        expect(b).toHaveProperty("left");
        expect(b).toHaveProperty("size");
        expect(typeof b.size).toBe("number");
      });
    });
  });
});
