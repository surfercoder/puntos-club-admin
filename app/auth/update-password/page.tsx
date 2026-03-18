import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { UpdatePasswordForm } from "@/components/update-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.updatePassword");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
