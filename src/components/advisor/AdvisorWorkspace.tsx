"use client";

/**
 * `/research/advisor` çalışma alanı (Faz 5 / Birim 5A.2).
 *
 * İki mod: `fit` (profil → hisse önerisi) ve `portfolio` (seçili hisseler →
 * ortak profil + benzer hisseler). Bakım durumu (`require_feature("advisor")`)
 * burada bir kez okunur ve iki forma da geçirilir; ayrıca istek 503 dönerse
 * form kendi hata bloğunda bakım metnini gösterir. Her iki uç da kredi
 * harcamaz; bu durum formlarda açıkça yazılıdır.
 */
import { BarChart3, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AdvisorFitForm } from "@/components/advisor/AdvisorFitForm";
import { AdvisorPortfolioForm } from "@/components/advisor/AdvisorPortfolioForm";
import { MaintenanceNotice } from "@/components/shared/MaintenanceNotice";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs } from "@/components/ui/tabs";
import { useMaintenance } from "@/hooks/useMaintenance";

export function AdvisorWorkspace() {
  const t = useTranslations("advisor");
  const maintenance = useMaintenance();
  const [tab, setTab] = useState("fit");

  const maintenanceBlocked = maintenance.isDisabled("advisor");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />

      {maintenanceBlocked ? (
        <MaintenanceNotice
          title={t("maintenance.title")}
          description={t("maintenance.description")}
        />
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(next) => setTab(next ?? "fit")}
        keepMounted
        items={[
          {
            value: "fit",
            label: (
              <span className="inline-flex items-center gap-1.5">
                <BarChart3 aria-hidden="true" className="size-3.5" />
                {t("modes.fit")}
              </span>
            ),
            content: <AdvisorFitForm maintenanceBlocked={maintenanceBlocked} />,
          },
          {
            value: "portfolio",
            label: (
              <span className="inline-flex items-center gap-1.5">
                <Wrench aria-hidden="true" className="size-3.5" />
                {t("modes.portfolio")}
              </span>
            ),
            content: <AdvisorPortfolioForm maintenanceBlocked={maintenanceBlocked} />,
          },
        ]}
      />
    </div>
  );
}
