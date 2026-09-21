/**
 * Misafir (anonim) dashboard gövdesi (Faz 5C / X-09).
 *
 * Sunucu bileşeni: veri `fetchGuestDashboardData` ile public uçlardan gelir
 * (kişisel veri YOK). Amaç anonime değer üretmek ve kayda teşvik etmektir:
 * piyasa nabzı, yükselen/düşenler ve güncel bülten önizlemesi gösterilir;
 * belirgin "Kayıt ol" / "Giriş yap" CTA'ları ("portföyünü kur, rapor üret")
 * değer önerisiyle birlikte sunulur.
 *
 * Var olan widget'lar yeniden kullanılır (Delta, PriceText, MarketStatusPill,
 * Markdown, Panel); sürükle-bırak YOK, düzen sabit CSS grid'tir (P-08).
 */
import type { Route } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { GuestDashboardData } from "@/app/(app)/(public-market)/dashboard/guest-dashboard-data";
import { DigestPreviewWidget } from "@/components/dashboard/DigestPreviewWidget";
import { GuestMoversWidget } from "@/components/dashboard/GuestMoversWidget";
import { MarketPulseWidget } from "@/components/dashboard/MarketPulseWidget";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";
import { RateLimitNotice } from "@/components/shared/RateLimitNotice";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GuestDashboardProps = {
  data: GuestDashboardData;
};

export async function GuestDashboard({ data }: GuestDashboardProps) {
  const t = await getTranslations("dashboard.guest");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<MarketStatusPill initialData={data.status ?? undefined} />}
      />

      {data.rateLimit.limited
        ? await RateLimitNotice({ retryAfter: data.rateLimit.retryAfter })
        : null}

      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">{t("valueTitle")}</h2>
            <p className="max-w-prose text-sm text-muted-foreground">{t("valueDescription")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/register" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
              {t("register")}
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              {t("login")}
            </Link>
            <Link
              href={"/markets" as Route}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              {t("markets")}
            </Link>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MarketPulseWidget initialData={data.pulse} className="sm:col-span-2" />
        <GuestMoversWidget
          title={t("gainers")}
          rows={data.gainers}
          emptyLabel={t("moversEmpty")}
        />
        <GuestMoversWidget title={t("losers")} rows={data.losers} emptyLabel={t("moversEmpty")} />
        <DigestPreviewWidget
          digest={data.digest.digest}
          failed={data.digest.failed}
          className="sm:col-span-2 lg:col-span-3"
        />
      </div>
    </div>
  );
}
