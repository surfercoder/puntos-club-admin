import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Email Confirmado | Puntos Club",
  description: "Tu email ha sido confirmado exitosamente.",
};

export default async function EmailConfirmedPage() {
  const t = await getTranslations("Auth.emailConfirmed");

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">{t("title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{t("message")}</p>
              <Button asChild className="w-full">
                <Link href="puntosclub://">{t("openApp")}</Link>
              </Button>
              <p className="text-xs text-muted-foreground">{t("openAppFallback")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
