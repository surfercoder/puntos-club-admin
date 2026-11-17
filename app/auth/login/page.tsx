import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.login");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default async function Page() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      {/* Fondo del mockup de CJ: manchas medidas sobre la imagen de 1536x1024, ancladas a las esquinas. */}
      <div
        id="login-bg"
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: [
            "radial-gradient(circle at right -64px top -150px, #FEDFEF 420px, transparent 470px)",
            "radial-gradient(circle at right -24px top 700px, #FDF2D0 150px, transparent 190px)",
            "radial-gradient(circle at left 20px bottom -106px, #FEDFEF 300px, transparent 345px)",
            "radial-gradient(circle at right -104px bottom -136px, #FEDFEF 290px, transparent 335px)",
            "#FEF1F7",
          ].join(", "),
        }}
      />
      <div className="relative w-full max-w-[35.375rem]">
        <Image
          src="/images/login-clubi.png"
          alt=""
          width={313}
          height={539}
          priority
          className="pointer-events-none absolute top-[2.1875rem] -left-[17.8125rem] z-10 hidden max-w-none select-none xl:block"
        />
        <LoginForm />
      </div>
    </div>
  );
}
