import React, { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({ resolvedTheme: "light" })),
}));

jest.mock("@/components/landing/styles/contact-form.css", () => ({}));

import {
  InputField,
  PhoneNumberField,
  InputTextArea,
  type ContactFormValues,
} from "@/components/landing/components/input-field";

const defaultErrors: Partial<ContactFormValues> = {};
const mockOnChange = jest.fn();

function createCircleRefs() {
  const ref = createRef<(HTMLDivElement | null)[]>() as React.MutableRefObject<
    (HTMLDivElement | null)[]
  >;
  ref.current = [];
  return ref;
}

describe("InputField", () => {
  it("renders without crashing", () => {
    const circleRefs = createCircleRefs();
    const { container } = render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders the label text", () => {
    const circleRefs = createCircleRefs();
    render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    expect(screen.getByText("First Name")).toBeInTheDocument();
  });

  it("renders an input element with the correct value", () => {
    const circleRefs = createCircleRefs();
    render(
      <InputField
        name="firstName"
        value="John"
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("John");
  });

  it("displays error message when present", () => {
    const circleRefs = createCircleRefs();
    const errors: Partial<ContactFormValues> = { firstName: "Required" };
    render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={errors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("calls onChange when input changes", () => {
    const circleRefs = createCircleRefs();
    render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Jane" } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("applies md:col-span-2 when colSpanMd is 2", () => {
    const circleRefs = createCircleRefs();
    const { container } = render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
        colSpanMd={2}
      />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("md:col-span-2");
  });
});

describe("PhoneNumberField", () => {
  it("renders without crashing", () => {
    const circleRefs = createCircleRefs();
    const { container } = render(
      <PhoneNumberField
        label="Phone"
        value=""
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders the label text", () => {
    const circleRefs = createCircleRefs();
    render(
      <PhoneNumberField
        label="Phone"
        value=""
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    expect(screen.getByText("Phone")).toBeInTheDocument();
  });

  it("renders a tel input with placeholder", () => {
    const circleRefs = createCircleRefs();
    render(
      <PhoneNumberField
        label="Phone"
        value=""
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    const input = screen.getByPlaceholderText("+54");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "tel");
  });

  it("displays phone number error when present", () => {
    const circleRefs = createCircleRefs();
    const errors: Partial<ContactFormValues> = {
      phoneNumber: "Invalid phone",
    };
    render(
      <PhoneNumberField
        label="Phone"
        value=""
        errors={errors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    expect(screen.getByText("Invalid phone")).toBeInTheDocument();
  });
});

describe("InputTextArea", () => {
  it("renders without crashing", () => {
    const circleRefs = createCircleRefs();
    const { container } = render(
      <InputTextArea
        name="message"
        value=""
        label="Message"
        color="#00FF00"
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders a textarea element", () => {
    const circleRefs = createCircleRefs();
    render(
      <InputTextArea
        name="message"
        value=""
        label="Message"
        color="#00FF00"
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    const textarea = screen.getByRole("textbox");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("renders the label text", () => {
    const circleRefs = createCircleRefs();
    render(
      <InputTextArea
        name="message"
        value=""
        label="Message"
        color="#00FF00"
        errors={defaultErrors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    expect(screen.getByText("Message")).toBeInTheDocument();
  });

  it("displays error message when present", () => {
    const circleRefs = createCircleRefs();
    const errors: Partial<ContactFormValues> = { message: "Too short" };
    render(
      <InputTextArea
        name="message"
        value=""
        label="Message"
        color="#00FF00"
        errors={errors}
        onChange={mockOnChange}
        circleRefs={circleRefs}
        index={0}
      />
    );
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });
});
