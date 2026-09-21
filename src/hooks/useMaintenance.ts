"use client";

/**
 * Bakım durumu (Faz 5 / Birim 5A.2).
 *
 * `GET /maintenance` bakımda olan özelliklerin listesini döner
 * (`{disabled_features: string[]}`). Danışman formu bu listeye bakarak
 * gönderimi baştan engeller ve net bir bakım uyarısı gösterir; ayrıca istek
 * yine `503` dönerse hata bu kancanın tazelenmesiyle de yakalanır.
 *
 * Güvenli varsayım: uç çökerse/hata verirse liste boş kabul edilir ve gönderim
 * engellenmez; gerçek kapı her zaman backend'dedir (`require_feature`).
 */
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";

/** Bakım durumunda sorgulanabilen özellikler (backend `_FEATURES`). */
export type MaintenanceFeature = "report_generate" | "simulation" | "news" | "advisor";

type MaintenanceResponse = {
  disabled_features: string[];
};

/** `GET /maintenance` — bakım listesi; uç hata verirse boş liste. */
export function useMaintenance() {
  const query = useQuery({
    queryKey: qk.maintenance(),
    queryFn: async () => {
      try {
        const data = await apiFetch<MaintenanceResponse>("/api/v1/maintenance");
        return Array.isArray(data.disabled_features) ? data.disabled_features : [];
      } catch {
        return [] as string[];
      }
    },
    staleTime: 60_000,
  });

  return {
    disabled: query.data ?? [],
    isDisabled: (feature: MaintenanceFeature) => (query.data ?? []).includes(feature),
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
