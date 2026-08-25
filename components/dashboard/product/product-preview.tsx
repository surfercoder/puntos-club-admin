"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

export type ProductPreviewData = {
  name: string;
  description: string;
  category: string;
  points: number;
  stock: number;
  imageUrl: string | null;
};

export function ProductPreview({ data }: { data: ProductPreviewData }) {
  const t = useTranslations("Dashboard.product.preview");

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">{t("title")}</h2>

        <div className="mt-4 grid aspect-[16/9] place-items-center overflow-hidden rounded-xl bg-brand-violet/5">
          {data.imageUrl ? (
            <Image
              alt={data.name || t("placeholderName")}
              className="size-full object-cover"
              height={338}
              src={data.imageUrl}
              width={600}
            />
          ) : (
            <ImageIcon className="size-12 text-brand-violet/40" />
          )}
        </div>

        <p className="mt-4 text-lg font-semibold">
          {data.name || t("placeholderName")}
        </p>
        {data.category && (
          <span className="mt-2 inline-block rounded-md bg-brand-violet/10 px-2 py-0.5 text-xs font-medium text-brand-violet">
            {data.category}
          </span>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {data.description || t("placeholderDescription")}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <dt className="text-xs text-muted-foreground">{t("points")}</dt>
            <dd className="text-lg font-bold text-brand-violet">
              {NUMBER_FORMATTER.format(data.points)} pts
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("stock")}</dt>
            <dd className="text-lg font-bold text-brand-blue">
              {t("units", { count: NUMBER_FORMATTER.format(data.stock) })}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border bg-brand-violet/5 p-5">
        <h3 className="text-sm font-semibold">{t("infoTitle")}</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("infoBody")}</p>
      </section>
    </div>
  );
}
