import Image from "next/image";
import {
  BarChart3,
  Box,
  ChevronDown,
  Gift,
  Headphones,
  House,
  Smartphone,
  Speaker,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Sparks } from "@/components/sitio/ui";

const BARS = [18, 22, 26, 30, 40, 44, 50, 46, 58, 66, 82];

/** Panel del admin dibujado en HTML (nítido a cualquier escala) con Clubi saludando adelante. */
export async function HeroDashboard() {
  const t = await getTranslations("Site.dashboard");
  const menu = [
    { icon: House, label: t("menu.dashboard") },
    { icon: Users, label: t("menu.beneficiaries") },
    { icon: Gift, label: t("menu.redemptions") },
    { icon: Box, label: t("menu.products") },
    { icon: BarChart3, label: t("menu.reports") },
  ];
  const stats = [
    { icon: Users, value: "4.250", label: t("beneficiaries") },
    { icon: Gift, value: "320", label: t("redemptions") },
    { icon: BarChart3, value: "+28%", label: t("growth") },
  ];
  const rewards = [
    { icon: Headphones, count: 120 },
    { icon: Speaker, count: 98 },
    { icon: Gift, count: 85 },
    { icon: Smartphone, count: 64 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[38rem] pt-6 pl-[37%] select-none" aria-hidden>
      {/* La tarjeta del panel, levemente en perspectiva como en el mockup. */}
      <div className="rounded-2xl bg-white/95 p-3 text-[0.55rem] text-sitio-ink shadow-[0_20px_50px_-20px_rgba(120,40,90,0.35)] ring-1 ring-[#f1dfe9] [transform:perspective(1200px)_rotateY(-8deg)] sm:text-[0.62rem]">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[1.35em] font-extrabold">
            <Image src="/images/logos/logo-regalo.png" alt="" width={318} height={318} className="size-5" />
            Puntos <span className="-ml-1 text-sitio-pink">Club</span>
          </span>
          <span className="flex items-center gap-1 rounded-md bg-[#f6f3f8] px-2 py-1">
            {t("plan")} <ChevronDown className="size-3" />
          </span>
        </div>
        <div className="flex gap-2">
          <ul className="flex w-[24%] shrink-0 flex-col gap-1">
            {menu.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className={`flex items-center gap-1 rounded-md px-1.5 py-1 ${i === 0 ? "bg-[#e6efff] font-semibold text-sitio-blue" : ""}`}
              >
                <Icon className="size-3 shrink-0" /> {label}
              </li>
            ))}
          </ul>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {stats.map(({ icon: Icon, value, label }, i) => (
                <div key={label} className="rounded-lg bg-white p-1.5 ring-1 ring-[#efe6ee]">
                  <Icon className={`size-3.5 ${i === 2 ? "text-sitio-blue" : "text-sitio-pink"}`} />
                  <p className="mt-0.5 text-[1.5em] leading-none font-extrabold">{value}</p>
                  <p className="text-[0.85em] text-[#6b6b85]">{label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-white p-1.5 ring-1 ring-[#efe6ee]">
              <div className="flex items-center justify-between font-semibold">
                {t("pointsRedeemed")}
                <span className="rounded bg-[#f6f3f8] px-1 py-0.5 text-[0.85em] font-normal">{t("lastMonths")}</span>
              </div>
              <div className="mt-1 flex h-12 items-end gap-[6%] px-1">
                {BARS.map((h, i) => (
                  <span key={i} className="flex-1 rounded-t-[2px] bg-sitio-pink" style={{ height: `${h}%`, opacity: 0.55 + (i / BARS.length) * 0.45 }} />
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-white p-1.5 ring-1 ring-[#efe6ee]">
              <p className="font-semibold">{t("topRewards")}</p>
              <div className="mt-1 grid grid-cols-4 gap-1.5">
                {rewards.map(({ icon: Icon, count }) => (
                  <div key={count} className="flex flex-col items-center gap-0.5 rounded-md bg-[#faf7fb] py-1.5">
                    <Icon className="size-5 text-sitio-ink" />
                    <span className="text-[0.85em] text-[#6b6b85]">{t("redemptionsCount", { count })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Image
        src="/images/sitio/clubi-saluda.png"
        alt=""
        width={310}
        height={292}
        priority
        className="absolute bottom-[-8%] -left-[4%] w-[47%] drop-shadow-[0_18px_20px_rgba(160,40,90,0.18)]"
      />
      <Sparks className="absolute top-0 left-[4%] size-12" />
    </div>
  );
}
