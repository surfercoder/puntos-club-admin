import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({ resolvedTheme: "light" })),
}));

jest.mock("@/components/landing/styles/contact-form.css", () => ({}));

import {
  InputField,
  type ContactFormValues,
} from "@/components/landing/components/input-field";
import { PhoneNumberField } from "@/components/landing/components/phone-number-field";
import { InputTextArea } from "@/components/landing/components/input-text-area";

const defaultErrors: Partial<ContactFormValues> = {};
const mockOnChange = jest.fn();
const noopSetRef = jest.fn();

describe("InputField", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders the label text", () => {
    render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    expect(screen.getByText("First Name")).toBeInTheDocument();
  });

  it("renders an input element with the correct value", () => {
    render(
      <InputField
        name="firstName"
        value="John"
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("John");
  });

  it("displays error message when present", () => {
    const errors: Partial<ContactFormValues> = { firstName: "Required" };
    render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={errors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("calls onChange when input changes", () => {
    render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Jane" } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("applies md:col-span-2 when colSpanMd is 2", () => {
    const { container } = render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
        colSpanMd={2}
      />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("md:col-span-2");
  });

  it("calls setCircleRef with the mounted element", () => {
    const setRef = jest.fn();
    render(
      <InputField
        name="firstName"
        value=""
        label="First Name"
        color="#FF0000"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={setRef}
      />
    );
    expect(setRef).toHaveBeenCalled();
    expect(setRef.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
  });
});

describe("PhoneNumberField", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <PhoneNumberField
        label="Phone"
        value=""
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders the label text", () => {
    render(
      <PhoneNumberField
        label="Phone"
        value=""
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    expect(screen.getByText("Phone")).toBeInTheDocument();
  });

  it("renders a tel input with placeholder", () => {
    render(
      <PhoneNumberField
        label="Phone"
        value=""
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    const input = screen.getByPlaceholderText("+54");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "tel");
  });

  it("displays phone number error when present", () => {
    const errors: Partial<ContactFormValues> = {
      phoneNumber: "Invalid phone",
    };
    render(
      <PhoneNumberField
        label="Phone"
        value=""
        errors={errors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    expect(screen.getByText("Invalid phone")).toBeInTheDocument();
  });

  it("calls setCircleRef with the mounted element", () => {
    const setRef = jest.fn();
    render(
      <PhoneNumberField
        label="Phone"
        value=""
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={setRef}
      />
    );
    expect(setRef).toHaveBeenCalled();
    expect(setRef.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
  });
});

describe("InputTextArea", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <InputTextArea
        name="message"
        value=""
        label="Message"
        color="#00FF00"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders a textarea element", () => {
    render(
      <InputTextArea
        name="message"
        value=""
        label="Message"
        color="#00FF00"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    const textarea = screen.getByRole("textbox");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("renders the label text", () => {
    render(
      <InputTextArea
        name="message"
        value=""
        label="Message"
        color="#00FF00"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    expect(screen.getByText("Message")).toBeInTheDocument();
  });

  it("displays error message when present", () => {
    const errors: Partial<ContactFormValues> = { message: "Too short" };
    render(
      <InputTextArea
        name="message"
        value=""
        label="Message"
        color="#00FF00"
        errors={errors}
        onChange={mockOnChange}
        setCircleRef={noopSetRef}
      />
    );
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("calls setCircleRef with the mounted element", () => {
    const setRef = jest.fn();
    render(
      <InputTextArea
        name="message"
        value=""
        label="Message"
        color="#00FF00"
        errors={defaultErrors}
        onChange={mockOnChange}
        setCircleRef={setRef}
      />
    );
    expect(setRef).toHaveBeenCalled();
    expect(setRef.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
  });
});
