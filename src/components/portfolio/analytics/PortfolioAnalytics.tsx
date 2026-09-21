"use client";

/**
 * Portföy analiz çalışma alanı (Faz 4 / Birim 4.3).
 *
 * Beş sekme: Getiri, Dağılım, Risk, Öne çıkanlar, Geçmiş. `keepMounted={false}`
 * sayesinde yalnız aktif sekme DOM'da kalır; bu yüzden bir sekme açılmadan
 * ilgili analiz uçlarına istek gitmez (eski uygulamadaki gereksiz istek
 * hatasının tekrarını önler). Başlangıçta hiçbir sekme seçili değildir.
 */
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Panel } from "@/components/shared/Panel";
import { Tabs, type TabItem } from "@/components/ui/tabs";

import { DiversificationTab } from "./DiversificationTab";
import { HistoryTab } from "./HistoryTab";
import { PerformersTab } from "./PerformersTab";
import { ReturnsTab } from "./ReturnsTab";
import { RiskTab } from "./RiskTab";

type PortfolioAnalyticsProps = {
  portfolioId: string;
};

export function PortfolioAnalytics({ portfolioId }: PortfolioAnalyticsProps) {
  const t = useTranslations("portfolio.analytics");
  const [tab, setTab] = useState<string | null>(null);

  const items: TabItem[] = [
    {
      value: "returns",
      label: t("tabs.returns"),
      content: <ReturnsTab portfolioId={portfolioId} />,
    },
    {
      value: "diversification",
      label: t("tabs.diversification"),
      content: <DiversificationTab portfolioId={portfolioId} />,
    },
    {
      value: "risk",
      label: t("tabs.risk"),
      content: <RiskTab portfolioId={portfolioId} />,
    },
    {
      value: "performers",
      label: t("tabs.performers"),
      content: <PerformersTab portfolioId={portfolioId} />,
    },
    {
      value: "history",
      label: t("tabs.history"),
      content: <HistoryTab portfolioId={portfolioId} />,
    },
  ];

  return (
    <Panel title={t("title")}>
      <Tabs
        items={items}
        value={tab}
        onValueChange={setTab}
        keepMounted={false}
        listClassName="overflow-x-auto"
      />
    </Panel>
  );
}
