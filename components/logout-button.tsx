"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const t = useTranslations("Auth");
  const { push } = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    push("/auth/login");
  };

  return <Button onClick={logout}>{t("logout")}</Button>;
}
