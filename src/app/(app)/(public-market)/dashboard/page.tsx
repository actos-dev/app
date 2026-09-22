/**
 * `/dashboard` — genel bakış (Faz 5B / Birim 5B.1, P-05, U-07, U-13; 5C / X-02, X-09).
 *
 * Faz 5C ile rota anonime açıldı ve oturum durumuna göre DALLANIR:
 *   - Oturum VARSA: tüm veri TEK pakette (`fetchDashboardData`) paralel
 *     yüklenir ve istemci widget'larına `initialData` geçirilir; kişisel
 *     uçlar yalnız buraya, `serverAuthApiFetch` ile çağrılır.
 *   - Oturum YOKSA: kişisel veri İSTEMEYEN gerçek misafir paneli
 *     (`fetchGuestDashboardData`) gösterilir; `/favorites`, `/portfolios/*`
 *     veya `/credits` uçlarına İSTEK ATILMAZ. Gerçek public veri + kayıt/giriş
 *     CTA'ları sunulur (X-09).
 *
 * Backend kapalı/hata durumunda yükleyiciler boş döner; sayfa çökmez.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { GuestDashboard } from "@/components/dashboard/GuestDashboard";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { PageHeader } from "@/components/shared/PageHeader";
import { getSession } from "@/lib/auth/session";

import { fetchDashboardData } from "./dashboard-data";
import { fetchGuestDashboardData } from "./guest-dashboard-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    const data = await fetchGuestDashboardData();
    // Async sunucu bileşeni sayfa içinde ÇÖZÜLÜR: böylece dönen ağaç tamamen
    // SSR edilir (testte de RTL ile doğrudan render edilebilir).
    return await GuestDashboard({ data });
  }

  const [data, t] = await Promise.all([fetchDashboardData(), getTranslations("dashboard")]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        actions={<MarketStatusPill initialData={data.status ?? undefined} />}
      />
      <DashboardOverview data={data} />
    </div>
  );
}
