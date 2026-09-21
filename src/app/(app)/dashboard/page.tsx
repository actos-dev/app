/**
 * `/dashboard` — genel bakış (Faz 5B / Birim 5B.1, P-05, U-07, U-13).
 *
 * Sunucu bileşeni: tüm veri TEK pakette (`fetchDashboardData`) paralel yüklenir
 * ve istemci widget'larına `initialData` geçirilir; böylece ilk boyamada ek
 * istek olmaz. Kredi AppShell'de çekildiği için burada tekrar istenmez.
 *
 * Backend kapalı/hata durumunda yükleyiciler `null` döner; sayfa çökmez,
 * widget'lar zarif boş/hata durumu gösterir.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { PageHeader } from "@/components/shared/PageHeader";

import { fetchDashboardData } from "./dashboard-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default async function DashboardPage() {
  const [data, t] = await Promise.all([fetchDashboardData(), getTranslations("dashboard")]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<MarketStatusPill initialData={data.status ?? undefined} />}
      />
      <DashboardOverview data={data} />
    </div>
  );
}
