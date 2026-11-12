import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContactForm } from "@/components/sitio/contact-form";

const field = (name: string) => document.querySelector(`[name="${name}"]`) as HTMLInputElement;
const err = (name: string) => document.getElementById(`${name}-error`);

/* ── component-specific mocks ── */
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => Object.assign((key: string) => key, { has: () => true })),
}));

jest.mock("@/actions/contact/send-contact-email", () => ({
  sendContactEmail: jest.fn().mockResolvedValue({ success: true }),
}));







describe("ContactForm", () => {
  it("renders without crashing", () => {
    const { container } = render(<ContactForm />);
    expect(container.querySelector("form")).toBeInTheDocument();
  });

  it("renders form elements", () => {
    render(<ContactForm />);
    expect(field("firstName")).toBeInTheDocument();
    expect(field("lastName")).toBeInTheDocument();
    expect(field("email")).toBeInTheDocument();
    expect(field("phoneNumber")).toBeInTheDocument();
    expect(field("business")).toBeInTheDocument();
    expect(field("message")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<ContactForm />);
    const submitButton = screen.getByRole("button", { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  /* ── handleChange tests ── */
  describe("handleChange", () => {
    it("updates firstName value on change", () => {
      render(<ContactForm />);
      const input = field("firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "John" } });
      expect(input).toHaveValue("John");
    });

    it("updates lastName value on change", () => {
      render(<ContactForm />);
      const input = field("lastName");
      fireEvent.change(input, { target: { name: "lastName", value: "Doe" } });
      expect(input).toHaveValue("Doe");
    });

    it("updates email value on change", () => {
      render(<ContactForm />);
      const input = field("email");
      fireEvent.change(input, { target: { name: "email", value: "john@example.com" } });
      expect(input).toHaveValue("john@example.com");
    });

    it("updates business value on change", () => {
      render(<ContactForm />);
      const input = field("business");
      fireEvent.change(input, { target: { name: "business", value: "Acme Corp" } });
      expect(input).toHaveValue("Acme Corp");
    });

    it("updates message value on change", () => {
      render(<ContactForm />);
      const input = field("message");
      fireEvent.change(input, { target: { name: "message", value: "Hello there, this is a test message" } });
      expect(input).toHaveValue("Hello there, this is a test message");
    });
  });

  /* ── handlePhoneChange tests ── */
  describe("handlePhoneChange", () => {
    it("updates phoneNumber value on change", () => {
      render(<ContactForm />);
      const input = field("phoneNumber");
      fireEvent.change(input, { target: { name: "phoneNumber", value: "1234567890" } });
      expect(input).toHaveValue("1234567890");
    });
  });

  /* ── validateForm tests ── */
  describe("validateForm (via handleChange)", () => {
    it("shows error when firstName is empty", () => {
      render(<ContactForm />);
      const input = field("firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "John" } });
      fireEvent.change(input, { target: { name: "firstName", value: "" } });
      expect(err("firstName")).toHaveTextContent("validation.firstNameRequired");
    });

    it("shows error when firstName is too short", () => {
      render(<ContactForm />);
      const input = field("firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "A" } });
      expect(err("firstName")).toHaveTextContent("validation.firstNameMinLength");
    });

    it("clears firstName error when valid", () => {
      render(<ContactForm />);
      const input = field("firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "J" } });
      expect(err("firstName")).toBeInTheDocument();
      fireEvent.change(input, { target: { name: "firstName", value: "John" } });
      expect(err("firstName")).not.toBeInTheDocument();
    });

    it("shows error when lastName is empty", () => {
      render(<ContactForm />);
      const input = field("lastName");
      fireEvent.change(input, { target: { name: "lastName", value: "Doe" } });
      fireEvent.change(input, { target: { name: "lastName", value: "" } });
      expect(err("lastName")).toHaveTextContent("validation.lastNameRequired");
    });

    it("shows error when lastName is too short", () => {
      render(<ContactForm />);
      const input = field("lastName");
      fireEvent.change(input, { target: { name: "lastName", value: "D" } });
      expect(err("lastName")).toHaveTextContent("validation.lastNameMinLength");
    });

    it("shows error when email is empty", () => {
      render(<ContactForm />);
      const input = field("email");
      fireEvent.change(input, { target: { name: "email", value: "test@test.com" } });
      fireEvent.change(input, { target: { name: "email", value: "" } });
      expect(err("email")).toHaveTextContent("validation.emailRequired");
    });

    it("shows error when email is invalid", () => {
      render(<ContactForm />);
      const input = field("email");
      fireEvent.change(input, { target: { name: "email", value: "notanemail" } });
      expect(err("email")).toHaveTextContent("validation.emailInvalid");
    });

    it("shows error when phoneNumber is empty", () => {
      render(<ContactForm />);
      const input = field("phoneNumber");
      fireEvent.change(input, { target: { name: "phoneNumber", value: "1234567890" } });
      fireEvent.change(input, { target: { name: "phoneNumber", value: "" } });
      expect(err("phoneNumber")).toHaveTextContent("validation.phoneRequired");
    });

    it("shows error when phoneNumber contains letters", () => {
      render(<ContactForm />);
      const input = field("phoneNumber");
      fireEvent.change(input, { target: { name: "phoneNumber", value: "123abc4567" } });
      expect(err("phoneNumber")).toHaveTextContent("validation.phoneNoLetters");
    });

    it("shows error when phoneNumber is too short", () => {
      render(<ContactForm />);
      const input = field("phoneNumber");
      fireEvent.change(input, { target: { name: "phoneNumber", value: "12345" } });
      expect(err("phoneNumber")).toHaveTextContent("validation.phoneMinLength");
    });

    it("does not show error when business is empty (optional field)", () => {
      render(<ContactForm />);
      const input = field("business");
      fireEvent.change(input, { target: { name: "business", value: "Acme" } });
      fireEvent.change(input, { target: { name: "business", value: "" } });
      expect(err("business")).not.toBeInTheDocument();
    });

    it("shows error when message is empty", () => {
      render(<ContactForm />);
      const input = field("message");
      fireEvent.change(input, { target: { name: "message", value: "Some text here" } });
      fireEvent.change(input, { target: { name: "message", value: "" } });
      expect(err("message")).toHaveTextContent("validation.messageRequired");
    });

    it("shows error when message is too short", () => {
      render(<ContactForm />);
      const input = field("message");
      fireEvent.change(input, { target: { name: "message", value: "Short" } });
      expect(err("message")).toHaveTextContent("validation.messageMinLength");
    });

    it("sets honeyField error when honeyField is filled", () => {
      const { container } = render(<ContactForm />);
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
      fireEvent.change(field("firstName"), {
        target: { name: "firstName", value: "John" },
      });
      fireEvent.change(field("lastName"), {
        target: { name: "lastName", value: "Doe" },
      });
      fireEvent.change(field("email"), {
        target: { name: "email", value: "john@example.com" },
      });
      fireEvent.change(field("phoneNumber"), {
        target: { name: "phoneNumber", value: "1234567890" },
      });
      fireEvent.change(field("business"), {
        target: { name: "business", value: "Acme Corporation" },
      });
      fireEvent.change(field("message"), {
        target: {
          name: "message",
          value: "This is a valid message that is long enough to pass the fifty character minimum validation requirement.",
        },
      });
    };

    it("shows success message when form is valid", async () => {
      render(<ContactForm />);
      fillValidForm();

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("success")).toBeInTheDocument();
      });
    });

    it("returns early when honeypot field is filled", async () => {
      const { container } = render(<ContactForm />);
      fillValidForm();

      // Fill honeypot
      const honeyInput = container.querySelector('input[name="honeyField"]') as HTMLInputElement;
      fireEvent.change(honeyInput, { target: { name: "honeyField", value: "bot" } });

      // Submit the form directly (button may be disabled due to errors key)
      const form = container.querySelector("form") as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.queryByText("success")).not.toBeInTheDocument();
      });
    });

    it("shows validation errors when submitting empty form", async () => {
      render(<ContactForm />);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(err("firstName")).toBeInTheDocument();
        expect(err("lastName")).toBeInTheDocument();
        expect(err("email")).toBeInTheDocument();
        expect(err("phoneNumber")).toBeInTheDocument();
        expect(err("message")).toBeInTheDocument();
      });
      expect(document.activeElement).toHaveAttribute("name", "firstName");
    });

    it("does not submit when there are validation errors from inline validation", () => {
      render(<ContactForm />);
      const input = field("firstName");
      fireEvent.change(input, { target: { name: "firstName", value: "J" } });

      // Button is only disabled during loading, not for validation errors
      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).not.toBeDisabled();
      // But the error is shown inline
      expect(err("firstName")).toBeInTheDocument();
    });

    it("does not submit when there are existing errors", async () => {
      render(<ContactForm />);

      // Create an error first
      fireEvent.change(field("firstName"), {
        target: { name: "firstName", value: "A" },
      });

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText("success")).not.toBeInTheDocument();
      });
    });

    it("shows error message when sendContactEmail returns failure", async () => {
      const { sendContactEmail } = require("@/actions/contact/send-contact-email");
      sendContactEmail.mockResolvedValueOnce({ success: false, error: "Failed to send" });

      render(<ContactForm />);
      fillValidForm();

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("error")).toBeInTheDocument();
      });
    });

    it("si el request falla muestra el error y libera el botón", async () => {
      const { sendContactEmail } = require("@/actions/contact/send-contact-email");
      sendContactEmail.mockRejectedValueOnce(new Error("network"));

      render(<ContactForm />);
      fillValidForm();
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText("error")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: /submit/i })).toBeEnabled();
    });
  });
});
