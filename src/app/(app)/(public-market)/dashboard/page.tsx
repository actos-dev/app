/**
 * `/dashboard` — genel bakış (Faz 5B / Birim 5B.1, P-05, U-07, U-13; 5C / X-02).
 *
 * Faz 5C ile rota anonime açıldı. Oturum YOKSA kişisel widget'lar çalıştırılmaz
 * (portföy/favori/kredi uçlarına istek atılmaz); bunun yerine güvenli bir
 * "guest" yer tutucu gösterilir. Gerçek guest dashboard 5C.2b birimindedir.
 *
 * Oturum VARSA: tüm veri TEK pakette (`fetchDashboardData`) paralel yüklenir ve
 * istemci widget'larına `initialData` geçirilir; ilk boyamada ek istek olmaz.
 * Backend kapalı/hata durumunda yükleyiciler `null` döner; sayfa çökmez.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

import { fetchDashboardData } from "./dashboard-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    const t = await getTranslations("dashboard");
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("title")} description={t("description")} />
        <Panel title={t("guest.noticeTitle")}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{t("guest.noticeDescription")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
              >
                {t("guest.login")}
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                {t("guest.register")}
              </Link>
              <Link
                href="/markets"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              >
                {t("guest.markets")}
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

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
