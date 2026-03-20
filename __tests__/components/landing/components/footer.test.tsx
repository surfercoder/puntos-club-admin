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

  it("renders legal link", () => {
    render(<Footer />);
    expect(screen.getByText("legal")).toBeInTheDocument();
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

  it("renders download links with correct hrefs", () => {
    render(<Footer />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "/legal/Aviso_Legal.pdf");
    expect(links[1]).toHaveAttribute("href", "/legal/Aviso_Legal.pdf");
    expect(links[2]).toHaveAttribute(
      "href",
      "/legal/Politica_de_Privacidad_y_Politica_de_Cookies.pdf"
    );
  });
});
