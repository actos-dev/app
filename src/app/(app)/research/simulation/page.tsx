/**
 * `/research/simulation` — Monte-Carlo simülasyonu (Faz 5 / Birim 5A.2).
 *
 * Sunucu bileşeni: gün başına maliyet şeması, simülasyon geçmişi ve kredi
 * bakiyesi PARALEL çekilir (çerez forward edilerek) ve istemci adasına
 * `initialData` olarak geçirilir; böylece ilk boyamada çift istek olmaz.
 *
 * Koşu SENKRONdur (B-09 job altyapısı yok): `GET /simulations/{ticker}` tek
 * istekte 600 sn'ye kadar sürebilir ve iptal edilemez. Bu karar
 * `SimulationForm` başında belgelenmiştir.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SimulationWorkspace } from "@/components/simulation/SimulationWorkspace";
import { serverAuthApiFetch } from "@/lib/api/server-auth";
import {
  simulationsCreditsServerPath,
  simulationsHistoryServerPath,
} from "@/lib/simulations/api-paths";
import type {
  PerDayCostResponse,
  SimulationCreditsResponse,
  SimulationHistoryItem,
} from "@/lib/simulations/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("simulation") };
}

export default async function SimulationPage() {
  const [perDayCost, history, credits] = await Promise.all([
    serverAuthApiFetch<PerDayCostResponse>("/api/v1/simulations/per-day-cost"),
    serverAuthApiFetch<SimulationHistoryItem[]>(simulationsHistoryServerPath()),
    serverAuthApiFetch<SimulationCreditsResponse>(simulationsCreditsServerPath()),
  ]);

  return (
    <SimulationWorkspace
      {...(perDayCost ? { initialPerDayCost: perDayCost } : {})}
      {...(Array.isArray(history) ? { initialHistory: history } : {})}
      {...(credits ? { initialCredits: credits } : {})}
    />
  );
}
