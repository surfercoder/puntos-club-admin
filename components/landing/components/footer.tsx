"use client";

import "@/components/landing/styles/footer.css";
import { useTranslations } from "next-intl";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const t = useTranslations("Landing.footer");

  return (
    <div className="flex flex-col w-full px-8 pt-10 pb-6">
      {/* Legal links and copyright */}
      <div className="flex flex-col md:flex-row w-full items-center gap-2 md:gap-5">
        <div className="flex flex-1 flex-col md:flex-row items-center gap-2 md:gap-5">
          <a
            className="font-light landing-footer-link text-sm"
            href="/legal/Aviso_Legal.pdf"
            download="Aviso legal"
          >
            {t("terms")}
          </a>
          <a
            className="font-light landing-footer-link text-sm"
            href="/legal/Aviso_Legal.pdf"
            download="Aviso legal"
          >
            {t("legal")}
          </a>
          <a
            className="font-light landing-footer-link text-sm"
            href="/legal/Politica_de_Privacidad_y_Politica_de_Cookies.pdf"
            download="Politica de Privacidad y Politica de Cookies"
          >
            {t("privacy")}
          </a>
        </div>
        <p className="font-light text-sm">
          {t("copyright", { year: currentYear })}
        </p>
      </div>
    </div>
  );
};

export default Footer;
