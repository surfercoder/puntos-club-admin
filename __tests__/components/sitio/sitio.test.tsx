import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/sitio/cta-band";
import { FaqExplorer } from "@/components/sitio/faq-explorer";
import { HeroDashboard } from "@/components/sitio/hero-dashboard";
import { HomePlans } from "@/components/sitio/home-plans";
import { MobileMenu, NavLinks } from "@/components/sitio/nav-links";
import { PlanCta } from "@/components/sitio/plan-cta";
import { PlansTable } from "@/components/sitio/plans-table";
import { SiteFooter } from "@/components/sitio/site-footer";
import { SiteHeader } from "@/components/sitio/site-header";
import { Blob, Cta, Pill, SectionTitle, Sparks } from "@/components/sitio/ui";
import { rich } from "@/components/sitio/rich";
import { LS_PLAN } from "@/lib/onboarding-storage";
import type { PlanLimitsByPlan } from "@/components/plan/plan-cards";

jest.mock("@/components/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

jest.mock("@/components/plan/plan-cards", () => ({
  PlanCards: ({ onSelect }: { onSelect: (p: string) => void }) => (
    <button type="button" onClick={() => onSelect("pro")}>
      plan-cards
    </button>
  ),
}));

// t.rich ejecuta cada etiqueta para que el render real de los resaltados quede probado.
const richT = () => {
  const t = (key: string) => key;
  t.rich = (key: string, values: Record<string, unknown> = {}) => (
    <>
      {key}
      {Object.entries(values).map(([k, v]) =>
        typeof v === "function" ? <span key={k}>{(v as (c: string) => React.ReactNode)(k)}</span> : null
      )}
    </>
  );
  return t;
};

beforeEach(() => {
  (getTranslations as jest.Mock).mockImplementation(async () => richT());
  (useTranslations as jest.Mock).mockImplementation(() => richT());
});

const push = jest.fn();
beforeEach(() => {
  push.mockReset();
  (useRouter as jest.Mock).mockReturnValue({ push });
});

describe("ui", () => {
  it("renderiza las etiquetas rich", () => {
    render(
      <p>
        {rich.hl("hl")}
        {rich.b("b")}
        {rich.small("small")}
      </p>
    );
    expect(screen.getByText("hl")).toHaveClass("text-sitio-pink");
    expect(screen.getByText("b").tagName).toBe("STRONG");
    expect(screen.getByText("small")).toBeInTheDocument();
  });

  it("renderiza los primitivos", () => {
    const { container } = render(
      <>
        <Sparks className="x" />
        <Pill>pill</Pill>
        <Blob className="blob" />
        <SectionTitle>title</SectionTitle>
        <Cta href="/a">default</Cta>
        <Cta href="/b" variant="outline" arrow={false} icon={<i data-testid="icon" />}>
          outline
        </Cta>
      </>
    );
    expect(container.querySelector("svg.x")).toBeInTheDocument();
    expect(screen.getByText("pill")).toBeInTheDocument();
    expect(container.querySelector(".blob")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "default" })).toHaveAttribute("href", "/a");
    expect(screen.getByRole("link", { name: "outline" })).toHaveClass("border-sitio-blue");
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("CtaBand muestra contenido y arte", () => {
    render(<CtaBand art={<span>art</span>}>content</CtaBand>);
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByText("art")).toBeInTheDocument();
  });
});

describe("NavLinks", () => {
  it("marca la sección activa", () => {
    (usePathname as jest.Mock).mockReturnValue("/planes");
    render(
      <NavLinks
        links={[
          { href: "/planes", label: "Planes" },
          { href: "/beneficios", label: "Beneficios" },
        ]}
      />
    );
    expect(screen.getByRole("link", { name: "Planes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Beneficios" })).not.toHaveAttribute("aria-current");
  });
});

describe("MobileMenu", () => {
  it("se cierra al cambiar de ruta", () => {
    (usePathname as jest.Mock).mockReturnValue("/planes");
    const menu = (
      <MobileMenu>
        <summary>menu</summary>
      </MobileMenu>
    );
    const { container, rerender } = render(menu);
    const details = container.querySelector("details") as HTMLDetailsElement;
    details.open = true;
    rerender(menu);
    expect(container.querySelector("details")?.open).toBe(true);
    (usePathname as jest.Mock).mockReturnValue("/beneficios");
    rerender(<MobileMenu><summary>menu</summary></MobileMenu>);
    expect(container.querySelector("details")?.open).toBe(false);
  });
});

describe("SiteHeader y SiteFooter", () => {
  it("el header tiene la navegación, el login y la demo", async () => {
    render(await SiteHeader());
    expect(screen.getAllByRole("link", { name: "nav.plans" })[0]).toHaveAttribute("href", "/planes");
    expect(screen.getAllByRole("link", { name: "nav.signIn" })[0]).toHaveAttribute("href", "/auth/login");
    expect(screen.getAllByRole("link", { name: "nav.requestDemo" })[0]).toHaveAttribute("href", "/contacto");
  });

  it("el footer tiene los legales y el selector de idioma", async () => {
    render(await SiteFooter());
    expect(screen.getByRole("link", { name: "footer.terms" })).toHaveAttribute("href", "/legal/terminos");
    expect(screen.getByRole("link", { name: "footer.privacy" })).toHaveAttribute("href", "/legal/privacidad");
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
  });
});

describe("HeroDashboard", () => {
  it("dibuja el panel con sus métricas", async () => {
    render(await HeroDashboard());
    expect(screen.getByText("4.250")).toBeInTheDocument();
    expect(screen.getByText("topRewards")).toBeInTheDocument();
  });
});

describe("planes", () => {
  const limits = {
    trial: { beneficiaries: 100, redeemable_products: 3, push_notifications_monthly: 200, cashiers: 1, branches: 1 },
    advance: { beneficiaries: 1000, beneficiary_map: 1, private_club: 0 },
    pro: { beneficiaries: -1, beneficiary_map: 1, private_club: 1, campaigns: 1, white_label: 1 },
  } as unknown as PlanLimitsByPlan;

  it("HomePlans arma las tres tarjetas desde plan_limits", async () => {
    render(await HomePlans({ limits }));
    expect(screen.getByText("beneficiariesUnlimited")).toBeInTheDocument();
    expect(screen.getAllByText("beneficiary_map")).toHaveLength(2);
    expect(screen.getByText("private_club")).toBeInTheDocument();
    expect(screen.getByText("white_label")).toBeInTheDocument();
    expect(screen.getByText("$12.499")).toBeInTheDocument();
    expect(screen.getByText("$24.999")).toBeInTheDocument();
  });

  it("HomePlans tolera un plan sin filas", async () => {
    render(await HomePlans({ limits: { trial: limits.trial } as PlanLimitsByPlan }));
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("PlanCta guarda el plan y va al onboarding", () => {
    render(<PlanCta plan="advance">go</PlanCta>);
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    expect(localStorage.getItem(LS_PLAN)).toBe("advance");
    expect(push).toHaveBeenCalledWith("/owner/onboarding");
  });

  it("PlanCta sigue sin storage", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<PlanCta plan="pro">go</PlanCta>);
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    expect(push).toHaveBeenCalledWith("/owner/onboarding");
  });

  it("PlansTable elige un plan", () => {
    render(<PlansTable limits={limits} />);
    fireEvent.click(screen.getByRole("button", { name: "plan-cards" }));
    expect(localStorage.getItem(LS_PLAN)).toBe("pro");
    expect(push).toHaveBeenCalledWith("/owner/onboarding");
  });
});

describe("FaqExplorer", () => {
  it("muestra las 28 preguntas y el chip abre su categoría", () => {
    const { container } = render(<FaqExplorer />);
    expect(screen.getByText("q28.q")).toBeInTheDocument();
    expect(container.querySelectorAll("details details")).toHaveLength(28);
    const billing = container.querySelector("#faq-billing") as HTMLDetailsElement;
    expect(billing.open).toBe(false);
    fireEvent.click(screen.getByRole("link", { name: "categories.billing" }));
    expect(billing.open).toBe(true);
    // Los links de las respuestas (etiquetas plans y demo).
    expect(screen.getAllByRole("link", { name: "plans" })[0]).toHaveAttribute("href", "/planes");
    expect(screen.getAllByRole("link", { name: "demo" })[0]).toHaveAttribute("href", "/contacto");
  });

  it("el chip no rompe si la categoría no está en el DOM", () => {
    render(<FaqExplorer />);
    const link = screen.getByRole("link", { name: "categories.other" });
    document.getElementById("faq-other")?.remove();
    expect(() => fireEvent.click(link)).not.toThrow();
  });
});
