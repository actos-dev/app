"use client";

/**
 * Kredi bakiyesi kancası (Faz 5 / Birim 5A.3, U-03).
 *
 * `GET /credits` tek paylaşılan sorgudur (`qk.credits()`); topbar göstergesi,
 * hesap menüsü ve rapor/simülasyon sihirbazları aynı önbelleği kullanır. RSC
 * ilk değeri `initialData` olarak tohumlar; böylece ilk boyamada istek olmaz.
 *
 * Tazeleme: kredi piyasa verisi DEĞİLDİR, bu yüzden `usePollingInterval`
 * (piyasa saatine bağlı) kullanılmaz. Tek sorgu olduğu için bileşen başına
 * çoğalan bir poll yoktur; 60 sn aralık + pencere odağında tazeleme yeterli.
 * (P-04'ün "bileşen başına refetchInterval yok" kuralı bu tekil, ortak
 * sorguda ihlal edilmez.)
 */
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import { CREDITS_PATH } from "@/lib/reports/api-paths";
import type { CreditsResponse } from "@/lib/reports/types";

/** Kredi bakiyesi tazeleme aralığı (ms). */
export const CREDITS_REFETCH_INTERVAL_MS = 60_000;

/**
 * "Düşük bakiye" eşiği. Uydurma bir kural değil: belgelenen en küçük rapor
 * maliyeti 1 kredidir (backend `reports._compute_cost`, min 1); bu nedenle
 * bakiye 1'in altındaysa yeni bir rapor finanse edilemez. Günlük dolum/tavan
 * gibi backend config değerleri burada TEKRARLANMAZ.
 */
export const LOW_CREDIT_THRESHOLD = 1;

/** Bakiyeyi "düşük" saymalı mı? (bilinmiyorsa hayır) */
export function isLowCredit(credits: number | undefined): boolean {
  return credits !== undefined && credits < LOW_CREDIT_THRESHOLD;
}

/** `GET /credits` — toplam kredi bakiyesi (U-03). */
export function useCredits(initialData?: CreditsResponse) {
  return useQuery({
    queryKey: qk.credits(),
    queryFn: () => apiFetch<CreditsResponse>(CREDITS_PATH),
    ...(initialData ? { initialData } : {}),
    staleTime: 30_000,
    refetchInterval: CREDITS_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}
