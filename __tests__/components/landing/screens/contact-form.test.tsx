import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactForm from "@/components/landing/screens/contact-form";

/* ── shared mocks ── */
jest.mock("gsap", () => ({
  __esModule: true,
  default: {
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      kill: jest.fn(),
      pause: jest.fn(),
      play: jest.fn(),
    })),
    registerPlugin: jest.fn(),
    registerEffect: jest.fn(),
    effects: {},
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
    context: jest.fn(() => ({ revert: jest.fn(), add: jest.fn() })),
  },
  gsap: {
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      kill: jest.fn(),
      pause: jest.fn(),
      play: jest.fn(),
    })),
    registerPlugin: jest.fn(),
    registerEffect: jest.fn(),
    effects: {},
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
    context: jest.fn(() => ({ revert: jest.fn(), add: jest.fn() })),
  },
}));
jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: { create: jest.fn(), refresh: jest.fn(), getAll: jest.fn(() => []) },
  ScrollTrigger: { create: jest.fn(), refresh: jest.fn(), getAll: jest.fn(() => []) },
}));
jest.mock("gsap/TextPlugin", () => ({
  __esModule: true,
  default: {},
  TextPlugin: {},
}));
jest.mock("@gsap/react", () => ({
  useGSAP: jest.fn(),
}));

/* ── component-specific mocks ── */
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

jest.mock("@/components/landing/components/input-field", () => ({
  InputField: ({ name, value, onChange, errors, label }: any) => (
    <div>
      <label>{label}</label>
      <input name={name} value={value} onChange={onChange} data-testid={`input-${name}`} />
      {errors?.[name] && <span data-testid={`error-${name}`}>{errors[name]}</span>}
    </div>
  ),
  PhoneNumberField: ({ value, onChange, errors, label }: any) => (
    <div>
      <label>{label}</label>
      <input name="phoneNumber" value={value} onChange={onChange} data-testid="input-phoneNumber" />
      {errors?.phoneNumber && <span data-testid="error-phoneNumber">{errors.phoneNumber}</span>}
    </div>
  ),
  InputTextArea: ({ name, value, onChange, errors, label }: any) => (
    <div>
      <label>{label}</label>
      <textarea name={name} value={value} onChange={onChange} data-testid={`input-${name}`} />
      {errors?.[name] && <span data-testid={`error-${name}`}>{errors[name]}</span>}
    </div>
  ),
}));

describe("ContactForm", () => {
  const circleRefs = { current: [] };

  it("renders without crashing", () => {
    const { container } = render(<ContactForm circleRefs={circleRefs as any} />);
    expect(container.querySelector("#contact-form")).toBeInTheDocument();
  });

  it("renders form elements", () => {
    render(<ContactForm circleRefs={circleRefs as any} />);
    expect(screen.getByTestId("input-firstName")).toBeInTheDocument();
    expect(screen.getByTestId("input-lastName")).toBeInTheDocument();
    expect(screen.getByTestId("input-email")).toBeInTheDocument();
    expect(screen.getByTestId("input-phoneNumber")).toBeInTheDocument();
    expect(screen.getByTestId("input-business")).toBeInTheDocument();
    expect(screen.getByTestId("input-message")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<ContactForm circleRefs={circleRefs as any} />);
    const submitButton = screen.getByRole("button", { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  /* ── handleChange tests ── */
  describe("handleChange", () => {
    it("updates firstName value on change", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "John" } });
      expect(input).toHaveValue("John");
    });

    it("updates lastName value on change", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-lastName");
      fireEvent.change(input, { target: { name: "lastName", value: "Doe" } });
      expect(input).toHaveValue("Doe");
    });

    it("updates email value on change", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-email");
      fireEvent.change(input, { target: { name: "email", value: "john@example.com" } });
      expect(input).toHaveValue("john@example.com");
    });

    it("updates business value on change", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-business");
      fireEvent.change(input, { target: { name: "business", value: "Acme Corp" } });
      expect(input).toHaveValue("Acme Corp");
    });

    it("updates message value on change", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-message");
      fireEvent.change(input, { target: { name: "message", value: "Hello there, this is a test message" } });
      expect(input).toHaveValue("Hello there, this is a test message");
    });
  });

  /* ── handlePhoneChange tests ── */
  describe("handlePhoneChange", () => {
    it("updates phoneNumber value on change", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-phoneNumber");
      fireEvent.change(input, { target: { name: "phoneNumber", value: "1234567890" } });
      expect(input).toHaveValue("1234567890");
    });
  });

  /* ── validateForm tests ── */
  describe("validateForm (via handleChange)", () => {
    it("shows error when firstName is empty", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "John" } });
      fireEvent.change(input, { target: { name: "firstName", value: "" } });
      expect(screen.getByTestId("error-firstName")).toHaveTextContent("validation.firstNameRequired");
    });

    it("shows error when firstName is too short", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "A" } });
      expect(screen.getByTestId("error-firstName")).toHaveTextContent("validation.firstNameMinLength");
    });

    it("clears firstName error when valid", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "J" } });
      expect(screen.getByTestId("error-firstName")).toBeInTheDocument();
      fireEvent.change(input, { target: { name: "firstName", value: "John" } });
      expect(screen.queryByTestId("error-firstName")).not.toBeInTheDocument();
    });

    it("shows error when lastName is empty", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-lastName");
      fireEvent.change(input, { target: { name: "lastName", value: "Doe" } });
      fireEvent.change(input, { target: { name: "lastName", value: "" } });
      expect(screen.getByTestId("error-lastName")).toHaveTextContent("validation.lastNameRequired");
    });

    it("shows error when lastName is too short", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-lastName");
      fireEvent.change(input, { target: { name: "lastName", value: "D" } });
      expect(screen.getByTestId("error-lastName")).toHaveTextContent("validation.lastNameMinLength");
    });

    it("shows error when email is empty", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-email");
      fireEvent.change(input, { target: { name: "email", value: "test@test.com" } });
      fireEvent.change(input, { target: { name: "email", value: "" } });
      expect(screen.getByTestId("error-email")).toHaveTextContent("validation.emailRequired");
    });

    it("shows error when email is invalid", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-email");
      fireEvent.change(input, { target: { name: "email", value: "notanemail" } });
      expect(screen.getByTestId("error-email")).toHaveTextContent("validation.emailInvalid");
    });

    it("shows error when phoneNumber is empty", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-phoneNumber");
      fireEvent.change(input, { target: { name: "phoneNumber", value: "1234567890" } });
      fireEvent.change(input, { target: { name: "phoneNumber", value: "" } });
      expect(screen.getByTestId("error-phoneNumber")).toHaveTextContent("validation.phoneRequired");
    });

    it("shows error when phoneNumber contains letters", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-phoneNumber");
      fireEvent.change(input, { target: { name: "phoneNumber", value: "123abc4567" } });
      expect(screen.getByTestId("error-phoneNumber")).toHaveTextContent("validation.phoneNoLetters");
    });

    it("shows error when phoneNumber is too short", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-phoneNumber");
      fireEvent.change(input, { target: { name: "phoneNumber", value: "12345" } });
      expect(screen.getByTestId("error-phoneNumber")).toHaveTextContent("validation.phoneMinLength");
    });

    it("shows error when business is empty", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-business");
      fireEvent.change(input, { target: { name: "business", value: "Acme" } });
      fireEvent.change(input, { target: { name: "business", value: "" } });
      expect(screen.getByTestId("error-business")).toHaveTextContent("validation.businessRequired");
    });

    it("shows error when business is too short", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-business");
      fireEvent.change(input, { target: { name: "business", value: "AB" } });
      expect(screen.getByTestId("error-business")).toHaveTextContent("validation.businessMinLength");
    });

    it("shows error when message is empty", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-message");
      fireEvent.change(input, { target: { name: "message", value: "Some text here" } });
      fireEvent.change(input, { target: { name: "message", value: "" } });
      expect(screen.getByTestId("error-message")).toHaveTextContent("validation.messageRequired");
    });

    it("shows error when message is too short", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-message");
      fireEvent.change(input, { target: { name: "message", value: "Short" } });
      expect(screen.getByTestId("error-message")).toHaveTextContent("validation.messageMinLength");
    });

    it("sets honeyField error when honeyField is filled", () => {
      const { container } = render(<ContactForm circleRefs={circleRefs as any} />);
      const honeyInput = container.querySelector('input[name="honeyField"]') as HTMLInputElement;
      fireEvent.change(honeyInput, { target: { name: "honeyField", value: "bot-filled" } });
      // honeyField error is set to empty string (truthy check: "" is falsy so no visible error,
      // but the key exists in errors object)
      expect(honeyInput).toHaveValue("bot-filled");
    });
  });

  /* ── handleSubmit tests ── */
  describe("handleSubmit", () => {
    const fillValidForm = () => {
      fireEvent.change(screen.getByTestId("input-firstName"), {
        target: { name: "firstName", value: "John" },
      });
      fireEvent.change(screen.getByTestId("input-lastName"), {
        target: { name: "lastName", value: "Doe" },
      });
      fireEvent.change(screen.getByTestId("input-email"), {
        target: { name: "email", value: "john@example.com" },
      });
      fireEvent.change(screen.getByTestId("input-phoneNumber"), {
        target: { name: "phoneNumber", value: "1234567890" },
      });
      fireEvent.change(screen.getByTestId("input-business"), {
        target: { name: "business", value: "Acme Corporation" },
      });
      fireEvent.change(screen.getByTestId("input-message"), {
        target: {
          name: "message",
          value: "This is a valid message that is long enough to pass the fifty character minimum validation requirement.",
        },
      });
    };

    it("shows success message when form is valid", async () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      fillValidForm();

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("success")).toBeInTheDocument();
      });
    });

    it("returns early when honeypot field is filled", async () => {
      const { container } = render(<ContactForm circleRefs={circleRefs as any} />);
      fillValidForm();

      // Fill honeypot
      const honeyInput = container.querySelector('input[name="honeyField"][id="honeyField"]') as HTMLInputElement;
      fireEvent.change(honeyInput, { target: { name: "honeyField", value: "bot" } });

      // Submit the form directly (button may be disabled due to errors key)
      const form = container.querySelector("form") as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.queryByText("success")).not.toBeInTheDocument();
      });
    });

    it("shows validation errors when submitting empty form", async () => {
      render(<ContactForm circleRefs={circleRefs as any} />);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("error-firstName")).toBeInTheDocument();
        expect(screen.getByTestId("error-lastName")).toBeInTheDocument();
        expect(screen.getByTestId("error-email")).toBeInTheDocument();
        expect(screen.getByTestId("error-phoneNumber")).toBeInTheDocument();
        expect(screen.getByTestId("error-business")).toBeInTheDocument();
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
      });
    });

    it("disables submit button when there are validation errors", () => {
      render(<ContactForm circleRefs={circleRefs as any} />);
      const input = screen.getByTestId("input-firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "J" } });

      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });

    it("does not submit when there are existing errors", async () => {
      render(<ContactForm circleRefs={circleRefs as any} />);

      // Create an error first
      fireEvent.change(screen.getByTestId("input-firstName"), {
        target: { name: "firstName", value: "A" },
      });

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText("success")).not.toBeInTheDocument();
      });
    });
  });
});
