import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import SitioLayout from "@/app/(sitio)/layout";
import Home, { generateMetadata as homeMeta } from "@/app/(sitio)/page";
import BeneficiosPage, { generateMetadata as benefitsMeta } from "@/app/(sitio)/beneficios/page";
import ComoFuncionaPage, { generateMetadata as howMeta } from "@/app/(sitio)/como-funciona/page";
import ContactoPage, { generateMetadata as contactMeta } from "@/app/(sitio)/contacto/page";
import PlanesPage, { generateMetadata as plansMeta } from "@/app/(sitio)/planes/page";
import PreguntasFrecuentesPage, { generateMetadata as faqMeta } from "@/app/(sitio)/preguntas-frecuentes/page";
import { getPublicPlanLimits } from "@/lib/plans/public-limits";

// Los hijos async (server components) no se pueden renderizar con RTL: tienen sus propios tests.
jest.mock("@/components/sitio/site-header", () => ({ SiteHeader: () => <header>header</header> }));
jest.mock("@/components/sitio/site-footer", () => ({ SiteFooter: () => <footer>footer</footer> }));
jest.mock("@/components/sitio/hero-dashboard", () => ({ HeroDashboard: () => <div>hero-dashboard</div> }));
jest.mock("@/components/sitio/home-plans", () => ({ HomePlans: () => <div>home-plans</div> }));
jest.mock("@/components/sitio/plans-table", () => ({ PlansTable: () => <div>plans-table</div> }));
jest.mock("@/components/sitio/faq-explorer", () => ({ FaqExplorer: () => <div>faq-explorer</div> }));
jest.mock("@/components/sitio/contact-form", () => ({ ContactForm: () => <form>contact-form</form> }));
jest.mock("@/lib/plans/public-limits", () => ({ getPublicPlanLimits: jest.fn() }));

beforeEach(() => {
  (getTranslations as jest.Mock).mockImplementation(async () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    return t;
  });
});

describe("sitio público", () => {
  it("el layout envuelve con header y footer", () => {
    render(<SitioLayout>contenido</SitioLayout>);
    expect(screen.getByText("header")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.getByText("footer")).toBeInTheDocument();
  });

  it("la home muestra los planes solo si hay plan_limits", async () => {
    (getPublicPlanLimits as jest.Mock).mockResolvedValueOnce({ trial: {} });
    const { container, unmount } = render(await Home());
    expect(screen.getByText("home-plans")).toBeInTheDocument();
    expect(container.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector('iframe[src*="youtube-nocookie.com/embed/Bpd916s3U0s"]')).toBeInTheDocument();
    unmount();

    (getPublicPlanLimits as jest.Mock).mockResolvedValueOnce(null);
    render(await Home());
    expect(screen.queryByText("home-plans")).not.toBeInTheDocument();
  });

  it("/planes muestra la tabla y da 404 sin plan_limits", async () => {
    (getPublicPlanLimits as jest.Mock).mockResolvedValueOnce({ trial: {} });
    const { unmount } = render(await PlanesPage());
    expect(screen.getByText("plans-table")).toBeInTheDocument();
    unmount();

    (getPublicPlanLimits as jest.Mock).mockResolvedValueOnce(null);
    await PlanesPage();
    expect(notFound).toHaveBeenCalled();
  });

  it.each([
    ["como-funciona", ComoFuncionaPage, "hero-dashboard"],
    ["beneficios", BeneficiosPage, "ctaTitle"],
    ["preguntas-frecuentes", PreguntasFrecuentesPage, "faq-explorer"],
    ["contacto", ContactoPage, "contact-form"],
  ])("renderiza /%s", async (_path, Page, marker) => {
    render(await Page());
    expect(screen.getByText(marker)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it.each([
    [homeMeta, "/"],
    [howMeta, "/como-funciona"],
    [plansMeta, "/planes"],
    [benefitsMeta, "/beneficios"],
    [faqMeta, "/preguntas-frecuentes"],
    [contactMeta, "/contacto"],
  ])("metadata con canonical %#", async (meta, canonical) => {
    const m = await meta();
    expect(m.title).toBeDefined();
    expect(m.alternates?.canonical).toBe(canonical);
  });
});
