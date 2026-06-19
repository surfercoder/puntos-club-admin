import { QRCodeSVG } from "qrcode.react";
import { Download, Smartphone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const apps = [
  {
    titleKey: "puntosClubTitle" as const,
    descriptionKey: "puntosClubDescription" as const,
    url: "https://drive.google.com/file/d/1nL1ypuKn2MtD4-erQLuFz_U_5ef3c3JD/view?usp=sharing",
  },
  {
    titleKey: "puntosClubCajaTitle" as const,
    descriptionKey: "puntosClubCajaDescription" as const,
    url: "https://drive.google.com/file/d/115Iapcb8biuvOx2TFtm5aWCo4DeZwcwx/view?usp=sharing",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("mobileAppsTitle"),
    description: t("mobileAppsDescription"),
  };
}

export default async function MobileAppsPage() {
  const t = await getTranslations("MobileApps");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Smartphone className="size-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        {apps.map((app) => (
          <Card key={app.titleKey} className="flex flex-col items-center">
            <CardHeader className="w-full pb-3 text-center">
              <CardTitle className="text-xl">{t(app.titleKey)}</CardTitle>
              <p className="text-sm text-muted-foreground">{t(app.descriptionKey)}</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="rounded-2xl border-4 border-primary bg-white p-6 shadow-md">
                <QRCodeSVG
                  value={app.url}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#31A1D6"
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("scanToDownload")}</p>
              <Button asChild className="w-full sm:hidden">
                <a href={app.url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 size-4" />
                  {t("download")}
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("androidOnly")}
      </p>
    </div>
  );
}
