import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SignUpForm } from "@/components/sign-up-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.signUp");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
