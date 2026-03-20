import React from "react";
import { render } from "@testing-library/react";
import { GiftSvg } from "@/components/landing/gift-svg";

describe("GiftSvg (components/landing/gift-svg)", () => {
  it("renders without crashing", () => {
    const { container } = render(<GiftSvg />);
    expect(container).toBeTruthy();
  });

  it("renders an SVG element", () => {
    const { container } = render(<GiftSvg />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("applies the className prop", () => {
    const { container } = render(<GiftSvg className="custom-class" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("custom-class");
  });

  it("has the correct viewBox", () => {
    const { container } = render(<GiftSvg />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 200 300");
  });

  it("has the correct preserveAspectRatio", () => {
    const { container } = render(<GiftSvg />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
  });

  it("contains rect elements for the gift boxes", () => {
    const { container } = render(<GiftSvg />);
    const rects = container.querySelectorAll("rect");
    expect(rects.length).toBeGreaterThan(0);
  });

  it("contains path elements for the bow", () => {
    const { container } = render(<GiftSvg />);
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(2);
  });

  it("contains a circle element", () => {
    const { container } = render(<GiftSvg />);
    const circle = container.querySelector("circle");
    expect(circle).toBeInTheDocument();
  });
});
