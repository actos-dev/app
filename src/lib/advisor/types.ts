/**
 * Danışman uçlarının tel formatı tipleri (Faz 5 / Birim 5A.2).
 *
 * NEDEN ELLE (YALNIZ YANIT gövdeleri): `FitRequest` ve
 * `PortfolioProfileRequest` **istek** şemaları `openapi.json`'da üretilmiştir
 * ve aşağıda `generated.ts`'ten alınır (tek kaynak). Buna karşılık iki ucun
 * **yanıt** gövdeleri `response_model` tanımlamadığından `openapi.json`
 * `unknown` üretir; şekiller backend kaynağından birebir çıkarıldı:
 *   - `POST /stocks/fit`       → `src/api/fit.py::fit_stocks` +
 *                                `src/analysis/stock_vector.py::rank_by_similarity`
 *   - `POST /portfolio/profile`→ `src/api/portfolio.py::portfolio_profile`
 *
 * Vektör sırası her yerde `VECTOR_KEYS = ["risk", "horizon", "profitability"]`.
 * `rank_by_similarity` çıktısı yalnız `horizon`/`profitability` hedefleriyle
 * ölçeklenir; `risk` ağırlığı `risk_tolerance`e bağlıdır.
 */
import type { components } from "@/types/generated";

/** `POST /stocks/fit` istek gövdesi (üretilmiş şema). */
export type FitRequest = components["schemas"]["FitRequest"];

/** `POST /portfolio/profile` istek gövdesi (üretilmiş şema). */
export type PortfolioProfileRequest = components["schemas"]["PortfolioProfileRequest"];

/** Danışman seviye değerleri (backend allowlist'leri). */
export const ADVISOR_HORIZONS = ["short", "medium", "long"] as const;
export const ADVISOR_PROFITABILITY = ["low", "medium", "high"] as const;
export const ADVISOR_RISK_TOLERANCE = ["low", "medium", "high"] as const;

export type AdvisorHorizon = (typeof ADVISOR_HORIZONS)[number];
export type AdvisorProfitability = (typeof ADVISOR_PROFITABILITY)[number];
export type AdvisorRiskTolerance = (typeof ADVISOR_RISK_TOLERANCE)[number];

/**
 * Tek hisse önerisi (`rank_by_similarity` satırı).
 *
 * `vector` sırası `[risk, horizon, profitability]`; `score = 1 / (1 + distance)`
 * ve `0..1` aralığındadır.
 */
export type AdvisorFitResult = {
  ticker: string;
  vector: [number, number, number];
  score: number;
  distance: number;
};

/**
 * `POST /stocks/fit` yanıtı.
 *
 * `query`, `build_query` çıktısıdır: `horizon_target`, `profitability_target`
 * (config haritalarından 0..1 hedefler) ve `risk_tolerance` ağırlığı.
 */
export type AdvisorFitResponse = {
  query: {
    horizon_target: number;
    profitability_target: number;
    risk_tolerance: number;
  };
  results: AdvisorFitResult[];
};

/** Portföy ortak profili (`estimate_profile` çıktısı). */
export type AdvisorEstimatedProfile = {
  risk: AdvisorRiskTolerance;
  horizon: AdvisorHorizon;
  profitability: AdvisorProfitability;
};

/**
 * `POST /portfolio/profile` yanıtı.
 *
 * `portfolio`, kullanıcının verdiği ticker'ların vektörü; `similar_stocks`,
 * popüler evrenden `limit` kadarı (skora göre azalan).
 */
export type AdvisorPortfolioResponse = {
  /** Ortalama vektör `[risk, horizon, profitability]`. */
  avg_vector: [number, number, number];
  estimated_profile: AdvisorEstimatedProfile;
  portfolio: { ticker: string; vector: [number, number, number] }[];
  similar_stocks: AdvisorFitResult[];
};
