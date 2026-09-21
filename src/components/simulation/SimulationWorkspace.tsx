"use client";

/**
 * `/research/simulation` çalışma alanı (Faz 5 / Birim 5A.2).
 *
 * Çalıştırma formu ve geçmiş sekmeleri tek istemci adasında toplanır;
 * `keepMounted` sayesinde sekme geçişinde form durumu ve geçmiş sorgusu korunur
 * (senkron koşu sürerken sekme değiştirmek isteği iptal etmez — B-09 yok).
 */
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { SimulationForm } from "@/components/simulation/SimulationForm";
import { SimulationHistory } from "@/components/simulation/SimulationHistory";
import { Tabs } from "@/components/ui/tabs";
import type {
  PerDayCostResponse,
  SimulationCreditsResponse,
  SimulationHistoryItem,
} from "@/lib/simulations/types";

type SimulationWorkspaceProps = {
  initialPerDayCost?: PerDayCostResponse;
  initialHistory?: SimulationHistoryItem[];
  initialCredits?: SimulationCreditsResponse;
};

export function SimulationWorkspace({
  initialPerDayCost,
  initialHistory,
  initialCredits,
}: SimulationWorkspaceProps) {
  const t = useTranslations("simulation");
  const [tab, setTab] = useState("run");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Tabs
        value={tab}
        onValueChange={(next) => setTab(next ?? "run")}
        keepMounted
        items={[
          {
            value: "run",
            label: t("tabs.run"),
            content: (
              <SimulationForm
                {...(initialPerDayCost ? { initialPerDayCost } : {})}
                {...(initialCredits ? { initialCredits } : {})}
              />
            ),
          },
          {
            value: "history",
            label: t("tabs.history"),
            content: <SimulationHistory {...(initialHistory ? { initialHistory } : {})} />,
          },
        ]}
      />
    </div>
  );
}
