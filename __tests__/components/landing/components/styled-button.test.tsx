import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StyledButton from "@/components/landing/components/styled-button";

describe("StyledButton", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <StyledButton ariaLabel="test button">
        <span>Click me</span>
      </StyledButton>
    );
    expect(container).toBeTruthy();
  });

  it("renders the children content", () => {
    render(
      <StyledButton ariaLabel="test button">
        <span>Click me</span>
      </StyledButton>
    );
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("has the correct aria-label", () => {
    render(
      <StyledButton ariaLabel="my action">
        <span>Action</span>
      </StyledButton>
    );
    const button = screen.getByRole("button", { name: "my action" });
    expect(button).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(
      <StyledButton ariaLabel="clickable" onClick={handleClick}>
        <span>Press</span>
      </StyledButton>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not throw when clicked without onClick prop", () => {
    render(
      <StyledButton ariaLabel="no handler">
        <span>Safe</span>
      </StyledButton>
    );
    expect(() => {
      fireEvent.click(screen.getByRole("button"));
    }).not.toThrow();
  });
});
