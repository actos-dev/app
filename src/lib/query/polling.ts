"use client";

/**
 * Merkezî polling (plan P-04, S-11).
 *
 * Tüm canlı fiyat sorguları `usePollingInterval()` döndürdüğü aralığı
 * kullanır; piyasa kapalıyken `false` döner ve hiç istek atılmaz. Piyasa
 * durumu tek paylaşılan `/market/status` sorgusundan okunur, bileşen başına
 * ayrı durum sorgusu yoktur.
 */
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import type { MarketStatus } from "@/types/market";

/** Piyasa açıkken veri yenileme aralığı. */
export const OPEN_POLL_INTERVAL_MS = 30_000;

/**
 * Açılış/kapanış geçişini yakalamak için durum sorgusunun kendi aralığı.
 *
 * Backend `/market/status` yanıtını 60 sn Redis'te tutar; bu yüzden daha sık
 * sormak boşa gider. `refetchIntervalInBackground` kasıtlı olarak
 * değiştirilmez (React Query varsayılanı `false`): sekme arka planda poll
 * etmez.
 */
export const MARKET_STATUS_REFETCH_MS = 60_000;

type MarketStatusOptions = {
  /** Sunucu bileşeninden gelen anlık durum; ilk boyama sunucuda olur. */
  initialData?: MarketStatus;
};

/** Paylaşılan piyasa durumu sorgusu. */
export function useMarketStatus(options: MarketStatusOptions = {}) {
  return useQuery({
    queryKey: qk.marketStatus(),
    queryFn: () => apiFetch<MarketStatus>("/api/v1/market/status"),
    refetchInterval: MARKET_STATUS_REFETCH_MS,
    ...(options.initialData
      ? {
          initialData: options.initialData,
          // Sunucudan gelen veri yaşını `as_of`'tan al ki hemen tekrar çekmesin.
          initialDataUpdatedAt: Date.parse(options.initialData.as_of),
        }
      : {}),
  });
}

/**
 * Canlı sorgular için yenileme aralığı.
 *
 * DİKKAT (S-11): 429 alındığında sorguların kendi `retry`/`retryDelay`
 * davranışı devreye girer; sunucu `Retry-After` döndüğünde bu aralık
 * artırılmalı, poll'lar durdurulmamalıdır (aç/geri çekil, sürdür). Backend
 * `Retry-After` desteği B-14 ile gelene kadar varsayılan üstel gecikme
 * kullanılır.
 */
export function usePollingInterval(): number | false {
  const { data } = useMarketStatus();
  return data?.open ? OPEN_POLL_INTERVAL_MS : false;
}
