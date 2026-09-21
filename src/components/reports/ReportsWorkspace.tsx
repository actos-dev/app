"use client";

/**
 * `/research/reports` çalışma alanı (Faz 5 / Birim 5A.1).
 *
 * Üretim sihirbazı ve geçmiş sekmeleri tek istemci adasında toplanır;
 * `keepMounted` sayesinde sekme geçişinde sihirbaz formu ve geçmiş sorgusu
 * korunur (üretim sürerken sekme değiştirmek isteği iptal etmez — B-09 yok).
 */
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ReportHistory } from "@/components/reports/ReportHistory";
import { ReportWizard } from "@/components/reports/ReportWizard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs } from "@/components/ui/tabs";
import type { CreditsResponse, ReportHistoryItem, ReportInfo } from "@/lib/reports/types";

type ReportsWorkspaceProps = {
  initialInfo?: ReportInfo;
  initialHistory?: ReportHistoryItem[];
  initialCredits?: CreditsResponse;
};

export function ReportsWorkspace({
  initialInfo,
  initialHistory,
  initialCredits,
}: ReportsWorkspaceProps) {
  const t = useTranslations("reports");
  const [tab, setTab] = useState("generate");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Tabs
        value={tab}
        onValueChange={(next) => setTab(next ?? "generate")}
        keepMounted
        items={[
          {
            value: "generate",
            label: t("tabs.generate"),
            content: <ReportWizard initialInfo={initialInfo} initialCredits={initialCredits} />,
          },
          {
            value: "history",
            label: t("tabs.history"),
            content: <ReportHistory initialHistory={initialHistory} />,
          },
        ]}
      />
    </div>
  );
}
