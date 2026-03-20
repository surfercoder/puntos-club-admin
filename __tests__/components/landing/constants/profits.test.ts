import {
  pointsMobile,
  pointsSmallScreen,
  pointsBigScreen,
} from "@/components/landing/constants/profits";

describe("profit points", () => {
  const allSets = [
    { name: "pointsMobile", points: pointsMobile },
    { name: "pointsSmallScreen", points: pointsSmallScreen },
    { name: "pointsBigScreen", points: pointsBigScreen },
  ];

  it.each(allSets)("$name exports an array", ({ points }) => {
    expect(Array.isArray(points)).toBe(true);
    expect(points.length).toBeGreaterThan(0);
  });

  it.each(allSets)(
    "$name each point has x, y, and color",
    ({ points }) => {
      points.forEach((p) => {
        expect(p).toHaveProperty("x");
        expect(p).toHaveProperty("y");
        expect(p).toHaveProperty("color");
        expect(typeof p.x).toBe("number");
        expect(typeof p.y).toBe("number");
        expect(typeof p.color).toBe("string");
      });
    },
  );

  it.each(allSets)(
    "$name interior points have titleKey and descKey",
    ({ points }) => {
      const interior = points.slice(1, -1);
      interior.forEach((p) => {
        expect(p).toHaveProperty("titleKey");
        expect(p).toHaveProperty("descKey");
      });
    },
  );

  it.each(allSets)(
    "$name first and last points have no titleKey/descKey",
    ({ points }) => {
      expect(points[0]).not.toHaveProperty("titleKey");
      expect(points[points.length - 1]).not.toHaveProperty("titleKey");
    },
  );
});
