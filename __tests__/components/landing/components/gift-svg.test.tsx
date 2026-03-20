import React from "react";
import { render } from "@testing-library/react";
import { Gift } from "@/components/landing/components/gift-svg";

describe("Gift (components/landing/components/gift-svg)", () => {
  it("renders without crashing", () => {
    const { container } = render(<Gift />);
    expect(container).toBeTruthy();
  });

  it("renders an SVG element", () => {
    const { container } = render(<Gift />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("applies the className prop", () => {
    const { container } = render(<Gift className="test-class" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("test-class");
  });

  it("applies the style prop", () => {
    const { container } = render(<Gift style={{ width: "100px" }} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveStyle({ width: "100px" });
  });

  it("has the correct viewBox", () => {
    const { container } = render(<Gift />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 200 300");
  });

  it("contains gift group elements", () => {
    const { container } = render(<Gift />);
    const giftGroup = container.querySelector("#gift-group");
    const giftGroup1 = container.querySelector("#gift-group1");
    expect(giftGroup).toBeInTheDocument();
    expect(giftGroup1).toBeInTheDocument();
  });
});
