import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key} ${JSON.stringify(params)}`;
    }
    return key;
  }),
}));

jest.mock("@/components/landing/styles/footer.css", () => ({}));

import Footer from "@/components/landing/components/footer";

describe("Footer", () => {
  it("renders without crashing", () => {
    const { container } = render(<Footer />);
    expect(container).toBeTruthy();
  });

  it("renders terms link", () => {
    render(<Footer />);
    expect(screen.getByText("terms")).toBeInTheDocument();
  });

  it("renders privacy link", () => {
    render(<Footer />);
    expect(screen.getByText("privacy")).toBeInTheDocument();
  });

  it("renders copyright text with current year", () => {
    const currentYear = new Date().getFullYear();
    render(<Footer />);
    expect(
      screen.getByText(`copyright ${JSON.stringify({ year: currentYear })}`)
    ).toBeInTheDocument();
  });

  // Los dos links apuntan a paginas propias y no a un PDF descargable. Hasta el
  // 24/09/2026 apuntaban a Aviso_Legal.pdf y Politica_de_Privacidad_*.pdf, que
  // eran la plantilla de otra empresa (Vibranio, S.L.) servida como propia.
  // Google Play ademas exige que la politica se pueda LEER en una URL publica.
  it("renders the legal links pointing to the public pages", () => {
    render(<Footer />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/legal/terminos");
    expect(links[1]).toHaveAttribute("href", "/legal/privacidad");
    links.forEach((link) => expect(link).not.toHaveAttribute("download"));
  });
});
