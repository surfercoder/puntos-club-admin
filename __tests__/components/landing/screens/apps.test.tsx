import { render, screen } from "@testing-library/react";
import Apps from "@/components/landing/screens/apps";

jest.mock("@/components/mobile-apps/app-download-qr-cards", () => ({
  AppDownloadQRCards: () => <div data-testid="qr-cards" />,
}));

describe("Apps", () => {
  it("renders the section with the download cards", () => {
    const { container } = render(<Apps />);
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("qr-cards")).toBeInTheDocument();
    expect(container.querySelector("section#apps")).toBeInTheDocument();
  });
});
