import Image from "next/image";
import Link from "next/link";
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
  const t = await getTranslations("Auth.login");

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-[35.375rem]">
        <Image
          src="/images/login-mascot.png"
          alt=""
          width={254}
          height={628}
          priority
          className="pointer-events-none absolute -top-10 right-full hidden max-w-none select-none xl:block"
        />
        <LoginForm />
        <p className="mt-[2.375rem] flex flex-wrap items-center justify-center gap-x-11 gap-y-2 text-lg font-medium sm:text-[1.1875rem]">
          {t("noAccount")}
          <Link
            href="/owner/onboarding"
            className="font-bold text-brand-pink underline-offset-4 hover:underline"
          >
            {t("signUpLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
