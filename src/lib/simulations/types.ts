/**
 * Simülasyon uçlarının tel formatı tipleri (Faz 5 / Birim 5A.2).
 *
 * NEDEN ELLE: Backend simülasyon uçları `response_model` tanımlamaz; bu yüzden
 * `openapi.json` gövdeleri `unknown` üretir (bkz. `lib/reports/types.ts` ve
 * `types/market.ts` başındaki aynı gerekçe). Şekiller backend kaynağından
 * birebir çıkarıldı:
 *   - `GET  /simulations/per-day-cost`      → `src/api/simulations.py::daily_cost`
 *   - `GET  /simulations/estimate-cost/{t}` → `estimate_cost`
 *   - `GET  /simulations/{ticker}`          → `simulate` + `src/simulation/montecarlo.py::simulate_from_data`
 *   - `GET  /simulations/history`           → `services/simulation_history.py::get_simulation_history`
 *   - `GET  /simulations/history/{id}`      → `services/simulation_history.py::get_simulation_detail`
 *   - `GET  /credits`                       → `src/api/auth.py::get_credits_endpoint`
 *
 * Backend bu gövdeleri `response_model` kazanıp `npm run gen:api` koşulduğunda
 * elle yazılan tipler `generated.ts` lehine silinmelidir.
 */
/** Backend `simulation` yapılandırmasının okunabilir alanları. */
export type PerDayCostResponse = {
  /** Gün başına kredi maliyeti (`config.simulation.per_day_cost`, varsayılan 0.005). */
  per_day_cost: number;
  /** Maliyet yuvarlama basamağı (backend `round`, varsayılan 3). */
  round: number;
};

/** `GET /simulations/estimate-cost/{ticker}?days=` yanıtı. */
export type EstimateCostResponse = {
  cost: number;
};

/**
 * Monte-Carlo güven aralığı (backend `confidence_interval`).
 *
 * `percent` = `1 - 2*bounds`; `bounds` backend'de **string** olarak saklanır
 * (`str(float)`), bu yüzden UI `bounds`'ı sayıya çevirerek kullanır.
 */
export type SimulationConfidence = {
  min: number;
  max: number;
  /** Kapsanan olasılık (ör. `0.9`). */
  percent: number;
  days: number;
  bounds: string;
};

/** Hedefin fiyata göre yönü (backend `simulate` sonunda eklenir). */
export type SimulationDirection = "above" | "below";

/**
 * `GET /simulations/{ticker}` yanıtı — koşunun tam gövdesi.
 *
 * `montecarlo.simulate_from_data` çıktısı (`prob_above`, `prob_below`,
 * `confidence`) backend tarafından zenginleştirilir: yön, kimlik, hedef ve
 * kredi muhasebesi eklenir.
 */
export type SimulationResult = {
  /** Simüle edilen final fiyatların hedefe eşit/üstünde kalma olasılığı. */
  prob_above: number;
  /** `1 - prob_above`. */
  prob_below: number;
  confidence: SimulationConfidence;
  direction: SimulationDirection;
  simulation_id: number;
  ticker: string;
  days: number;
  /** Kullanıcı hedefi veya `"auto"` (backend otomatik +%10 üretir). */
  target: string;
  bounds: string;
  credits_spend: number;
  remaining_credits: number;
};

/** `GET /simulations/history` satırı. */
export type SimulationHistoryItem = {
  id: number;
  ticker: string;
  days: number;
  bounds: string;
  /** Kaydedilen hedef; hedef verilmediyse `"auto"`. */
  target: string;
  cost: number | null;
  created_at: string;
};

/**
 * `GET /simulations/history/{id}` yanıtı.
 *
 * `result` kayıt anındaki ham Monte-Carlo çıktısıdır; kimlik/hedef/kredi
 * zenginleştirmesi üst seviye alanlarda ayrıca durur (`direction` opsiyoneldir
 * çünkü yön yalnız koşu yanıtına eklenir, saklanan `result`'a değil).
 */
export type SimulationHistoryDetail = {
  id: number;
  ticker: string;
  days: number;
  bounds: string;
  target: string;
  result: {
    prob_above?: number;
    prob_below?: number;
    confidence?: SimulationConfidence;
    direction?: SimulationDirection;
    [key: string]: unknown;
  };
  cost: number | null;
  created_at: string;
};

/** `GET /credits` yanıtı (rapor modülüyle aynı şekil). */
export type SimulationCreditsResponse = { credits: number };
