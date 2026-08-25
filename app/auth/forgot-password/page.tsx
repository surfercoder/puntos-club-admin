import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ForgotPasswordForm } from "@/components/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.forgotPassword");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-[37.5rem]">
        <Image
          src="/images/forgot-password-mascot.png"
          alt=""
          width={365}
          height={534}
          priority
          className="pointer-events-none absolute top-8 right-full -mr-2 hidden max-w-none select-none xl:block"
        />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
