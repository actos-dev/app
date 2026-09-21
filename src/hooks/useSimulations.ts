"use client";

/**
 * Simülasyon sorgu/mutasyon kancaları (Faz 5 / Birim 5A.2, U-03, U-06).
 *
 * Sunucu bileşeni ilk veriyi `initialData` olarak tohumlar; böylece ilk
 * boyamada çift istek olmaz.
 *
 * Bilinçli sınır (B-09): job/ilerleme ucu yoktur; `GET /simulations/{ticker}`
 * SENKRON tek HTTP isteğidir ve 600 sn'ye kadar sürebilir. Bu katman iptal veya
 * gerçek yüzde sunmaz; UI yalnız geçen süreyi ve dürüst bir aşama metnini
 * gösterir. Uzun iş sürerken gönderim kilitlenir.
 *
 * Kredi (U-03): bakiye `GET /credits`ten; maliyet `estimate-cost` veya
 * `per-day-cost` şemasından gelir. Bakiye yetersizse gönderim BAŞTAN engellenir
 * (bu kontrol `SimulationWorkspace` içinde yapılır). Backend yine de 402
 * dönebilir; hata kodu toast'a i18n metni olarak yazılır (B-07).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ApiError, apiFetch } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import { qk } from "@/lib/query/keys";
import {
  SIMULATIONS_HISTORY_PATH,
  SIMULATIONS_PER_DAY_COST_PATH,
  simulationDetailPath,
  simulationEstimateCostPath,
  simulationRunPath,
} from "@/lib/simulations/api-paths";
import type {
  EstimateCostResponse,
  PerDayCostResponse,
  SimulationCreditsResponse,
  SimulationHistoryDetail,
  SimulationHistoryItem,
  SimulationResult,
} from "@/lib/simulations/types";

/** `GET /simulations/per-day-cost` — maliyet şeması (seyrek değişir). */
export function useSimulationPerDayCost(initialData?: PerDayCostResponse) {
  return useQuery({
    queryKey: qk.simulations.perDayCost(),
    queryFn: () => apiFetch<PerDayCostResponse>(SIMULATIONS_PER_DAY_COST_PATH),
    ...(initialData ? { initialData } : {}),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * `GET /simulations/estimate-cost/{ticker}?days=` — tahmini maliyet.
 *
 * Sembol ve gün geçerliyken açılır; gün sayısı değiştikçe yeni anahtar üretilir
 * (aynı sorgu tekrar paylaşılır). Maliyet `per_day_cost * days` ile de aynı
 * sonucu verir; bu uç backend'in yuvarlamasını birebir yansıtır.
 */
export function useSimulationEstimate(ticker: string, days: number, enabled = true) {
  const normalized = ticker.trim().toUpperCase();
  return useQuery({
    queryKey: qk.simulations.estimate(normalized, days),
    queryFn: () =>
      apiFetch<EstimateCostResponse>(simulationEstimateCostPath(normalized), {
        query: { days },
      }),
    enabled: enabled && normalized.length > 0 && Number.isFinite(days) && days > 0,
  });
}

/** `GET /credits` — toplam kredi bakiyesi (U-03). */
export function useSimulationCredits(initialData?: SimulationCreditsResponse) {
  return useQuery({
    queryKey: qk.credits(),
    queryFn: () => apiFetch<SimulationCreditsResponse>("/api/v1/credits"),
    ...(initialData ? { initialData } : {}),
  });
}

/** `GET /simulations/history` — simülasyon geçmişi. */
export function useSimulationHistory(initialData?: SimulationHistoryItem[]) {
  return useQuery({
    queryKey: qk.simulations.list(),
    queryFn: () =>
      apiFetch<SimulationHistoryItem[]>(SIMULATIONS_HISTORY_PATH, {
        query: { limit: 50, offset: 0 },
      }),
    ...(initialData ? { initialData } : {}),
  });
}

/** `GET /simulations/history/{id}` — tek simülasyon detayı (diyalog açılınca). */
export function useSimulationDetail(id: number | null) {
  return useQuery({
    queryKey: qk.simulations.detail(id ?? "none"),
    queryFn: () => apiFetch<SimulationHistoryDetail>(simulationDetailPath(id as number)),
    enabled: id !== null,
  });
}

/** Yazma hatalarında ortak toast; kod → `apiErrors.*` anahtarına çevrilir. */
function useSimulationErrorToast() {
  const t = useTranslations();
  return (error: unknown) => {
    toast.error(t(translateBackendError(error instanceof ApiError ? error.code : undefined)));
  };
}

/** Koşu girişi; `target` yoksa backend'e gönderilmez (otomatik +%10). */
export type RunSimulationInput = {
  ticker: string;
  days: number;
  bounds: string;
  target?: string;
};

/**
 * `GET /simulations/{ticker}` — senkron Monte-Carlo koşusu.
 *
 * Başarıda: kredi bakiyesi yanıttan güncellenir, geçmiş tazelenir ve dönen
 * sonuç mutation verisi olarak çağırana verilir (U-03). Hata `detail` kodu
 * toast'a i18n metni olarak yazılır; ham backend metni ekrana basılmaz (B-07).
 */
export function useRunSimulation() {
  const queryClient = useQueryClient();
  const t = useTranslations("simulation");
  const showError = useSimulationErrorToast();

  return useMutation({
    mutationFn: (input: RunSimulationInput) =>
      apiFetch<SimulationResult>(simulationRunPath(input.ticker.trim().toUpperCase()), {
        query: {
          days: input.days,
          bounds: input.bounds,
          ...(input.target ? { target: input.target } : {}),
        },
      }),
    onSuccess: (data) => {
      toast.success(t("run.success.title"));
      queryClient.setQueryData<SimulationCreditsResponse>(qk.credits(), {
        credits: data.remaining_credits,
      });
      void queryClient.invalidateQueries({ queryKey: qk.simulations.list() });
      void queryClient.invalidateQueries({ queryKey: qk.credits() });
    },
    onError: showError,
  });
}
