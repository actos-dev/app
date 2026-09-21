"use client";

/**
 * Danışman sorgu kancaları (Faz 5 / Birim 5A.2).
 *
 * Her iki uç da `POST` olduğundan ve kullanıcı eylemiyle tetiklendiğinden
 * React Query **mutation** olarak değil, `enabled` bayraklı `useQuery` olarak
 * modellenir: böylece aynı parametre kombinasyonu tekrar çalıştırıldığında
 * önbellekten gelir ve "analiz et" iki kez tıklanınca çift istek oluşmaz.
 *
 * Bakım modu: `require_feature("advisor")` kapalıyken backend `503` ve düz
 * İngilizce `"advisor is temporarily disabled for maintenance"` döner. Bu
 * hata `translateBackendError` ile jenerik anahtara düşer; çağıran taraf
 * `ApiError.status === 503` durumunu ayrıca yakalayıp bakım durumunu gösterir
 * (bkz. `AdvisorWorkspace` — eski uygulamadaki sessiz başarısızlık tekrarlanmaz).
 *
 * Kredi HARCAZ: iki uç da kredi muhasebesinden muaftır (backend kredi
 * tüketmez); bu yüzden danışmanda kredi ön kontrolü YOKTUR.
 */
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { ADVISOR_FIT_PATH, ADVISOR_PORTFOLIO_PROFILE_PATH } from "@/lib/advisor/api-paths";
import type {
  AdvisorFitResponse,
  AdvisorPortfolioResponse,
  AdvisorHorizon,
  AdvisorProfitability,
  AdvisorRiskTolerance,
} from "@/lib/advisor/types";
import { qk } from "@/lib/query/keys";

export type AdvisorFitInput = {
  horizon: AdvisorHorizon;
  profitability: AdvisorProfitability;
  riskTolerance: AdvisorRiskTolerance;
  limit?: number;
};

/**
 * `POST /stocks/fit` — vade/kârlılık/risk profiline göre hisse önerisi.
 *
 * `enabled=false` iken hiç istek atılmaz ("analiz et" öncesi). Gövde backend
 * `FitRequest` şemasıyla birebir uyumludur (`risk_tolerance` snake_case).
 */
export function useAdvisorFit(input: AdvisorFitInput, enabled: boolean) {
  const limit = input.limit ?? 5;
  return useQuery({
    queryKey: qk.advisor.fit({ ...input, limit }),
    queryFn: () =>
      apiFetch<AdvisorFitResponse>(ADVISOR_FIT_PATH, {
        method: "POST",
        body: {
          horizon: input.horizon,
          profitability: input.profitability,
          risk_tolerance: input.riskTolerance,
          limit,
        },
      }),
    enabled,
    // Profil aynı kalırsa sonuç da aynıdır; analiz tekrar tazelenmemeli.
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 5 * 60_000,
  });
}

/**
 * `POST /portfolio/profile` — seçili ticker listesinden ortak profil + benzer
 * hisseler. Boş liste geçersizdir (backend 422); çağıran `enabled` ile kapatır.
 */
export function useAdvisorPortfolioProfile(
  tickers: readonly string[],
  limit: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: qk.advisor.profile(tickers, limit),
    queryFn: () =>
      apiFetch<AdvisorPortfolioResponse>(ADVISOR_PORTFOLIO_PROFILE_PATH, {
        method: "POST",
        body: { tickers: [...tickers], limit },
      }),
    enabled: enabled && tickers.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 5 * 60_000,
  });
}
