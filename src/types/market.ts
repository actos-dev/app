/**
 * Piyasa uçlarının tel formatı tipleri (Faz 3 / Birim 3.1).
 *
 * NEDEN ELLE: Backend uçları `response_model` tanımlamıyor, bu yüzden
 * `openapi.json` bu yollar için `unknown` üretiyor (`src/types/generated.ts`).
 * Tipler backend kaynağından birebir çıkarıldı:
 *   - `/market/status`            → `backend/src/services/market.py:79`
 *   - `/companies/summary`        → `backend/src/services/company.py:310`
 *   - `/companies/info/{ticker}`  → `backend/src/services/company.py:153`
 *   - `/price/history/{ticker}`   → `backend/src/services/price.py:256`
 *   - `/news/{ticker}`            → `backend/src/models/article.py`
 *   - `/economy/quotes`           → `backend/src/finance/models.py` (QuoteBundle)
 *   - `/economy/history/{symbol}` → `backend/src/finance/models.py` (Candle)
 *
 * Backend bu uçlara `response_model` ekleyip `npm run gen:api` koşulduğunda bu
 * dosya silinip `generated.ts` tipleri kullanılmalı (bkz. AGENTS.md "API
 * tipleri"). O güne kadar tel sözleşmesi burada tek yerde tutulur.
 */

/** `GET /api/v1/market/status` (BIST açık/kapalı + tatil bilgisi). */
export type MarketStatus = {
  open: boolean;
  /** ISO-8601; piyasa açıkken `null`. */
  next_open_at: string | null;
  /** IANA saat dilimi, ör. `Europe/Istanbul`. */
  timezone: string;
  is_holiday: boolean;
  holiday_name: string | null;
  /** Yanıtın hesaplandığı an (ISO-8601). */
  as_of: string;
};

/**
 * `GET /api/v1/price/current` yanıtı (`services/quote.py::_build_quote`).
 *
 * Tek sembolün anlık fiyatı; portföy al/sat diyaloğunda TEK istek ile çekilir
 * (satır başına istek yok). `price` alınamazsa backend 404 döner.
 */
export type CurrentPriceQuote = {
  ticker: string;
  price: number | null;
  previous_close: number | null;
  absolute_change: number | null;
  change_pct: number | null;
  as_of: string | null;
  previous_close_as_of: string | null;
  market_status: string;
  is_stale: boolean;
  change_window: string;
  /** Yalnız `/price/current` yanıtında bulunur. */
  interval?: string;
};

/** `GET /api/v1/companies/summary` içindeki tek hisse satırı. */
export type CompanySummary = {
  ticker: string;
  name: string;
  sector: string | null;
  last_price: number | null;
  change_pct: number | null;
  previous_close: number | null;
  absolute_change: number | null;
  /** `last_session_change` | `previous_session_close` gibi pencere etiketi. */
  change_window: string;
  /** `open` | `closed`. */
  market_status: string;
  is_stale: boolean;
  as_of: string | null;
  previous_close_as_of: string | null;
  day_high: number | null;
  day_low: number | null;
  volume: number | null;
  market_cap: number | null;
  currency: string;
  price_updated_at: string | null;
};

/** `GET /api/v1/companies/summary` yanıtı. */
export type CompanySummaryResponse = {
  data: CompanySummary[];
  total: number;
};

/** `/companies/summary` sıralama seçenekleri (backend allowlist'i). */
export type CompanySummarySort =
  | "popular"
  | "alphabetical"
  | "gainers"
  | "losers"
  | "price_high"
  | "price_low"
  | "volume"
  | "market_cap";

/** `GET /api/v1/companies/info/{ticker}` piyasa bloğu. */
export type CompanyInfoMarket = {
  currentPrice: number | null;
  previousClose: number | null;
  marketCap: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  regularMarketVolume: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  regularMarketTime: number | null;
};

/** `GET /api/v1/companies/info/{ticker}` işlem metrikleri. */
export type CompanyInfoTrading = {
  beta: number | null;
  sharesOutstanding: number | null;
  floatShares: number | null;
  averageVolume: number | null;
  averageVolume10days: number | null;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;
  shortRatio: number | null;
  heldPercentInsiders: number | null;
  heldPercentInstitutions: number | null;
};

/** `GET /api/v1/companies/info/{ticker}` değerleme bloğu. */
export type CompanyInfoValuation = {
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSalesTrailing12Months: number | null;
  enterpriseValue: number | null;
  enterpriseToEbitda: number | null;
  enterpriseToRevenue: number | null;
  bookValue: number | null;
  trailingEps: number | null;
  forwardEps: number | null;
  dividendYield: number | null;
  payoutRatio: number | null;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  recommendationKey: string | null;
  numberOfAnalystOpinions: number | null;
};

/** `GET /api/v1/companies/info/{ticker}` finansallar bloğu. */
export type CompanyInfoFinancials = {
  totalRevenue: number | null;
  revenuePerShare: number | null;
  revenueGrowth: number | null;
  grossProfits: number | null;
  grossMargins: number | null;
  ebitda: number | null;
  ebitdaMargins: number | null;
  netIncomeToCommon: number | null;
  profitMargins: number | null;
  operatingMargins: number | null;
  operatingCashflow: number | null;
  freeCashflow: number | null;
  earningsGrowth: number | null;
  earningsQuarterlyGrowth: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
};

/** `GET /api/v1/companies/info/{ticker}` bilanço bloğu. */
export type CompanyInfoBalanceSheet = {
  totalCash: number | null;
  totalCashPerShare: number | null;
  totalDebt: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
};

/** `GET /api/v1/companies/info/{ticker}` analist tavsiyesi. */
export type CompanyInfoRecommendation = {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
};

/** `GET /api/v1/companies/info/{ticker}` yanıtı. */
export type CompanyInfo = {
  symbol: string | null;
  name: string | null;
  sector: string | null;
  industry: string | null;
  currency: string | null;
  exchange: string | null;
  market: CompanyInfoMarket;
  trading: CompanyInfoTrading;
  valuation: CompanyInfoValuation;
  financials: CompanyInfoFinancials;
  balanceSheet: CompanyInfoBalanceSheet;
  recommendations: CompanyInfoRecommendation[];
};

/** `/price/history/{ticker}` ve `/economy/history/{symbol}` mumu. */
export type PriceCandle = {
  ts: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

/** `/economy/history/{symbol}` mumu (finans modeli; `source` ek alanı). */
export type EconomyCandle = {
  symbol: string;
  interval: string;
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  source: string | null;
};

/** `/economy/quotes` tek quote kaydı (`Quote` modeli). */
export type EconomyQuote = {
  symbol: string;
  buying: number | null;
  selling: number | null;
  price: number | null;
  change_pct: number | null;
  change_text: string | null;
  currency: string;
  unit: string;
  source: string;
  ts: string;
  stale: boolean;
  extra: Record<string, unknown>;
};

/** `/economy/quotes` yanıtı (`QuoteBundle` modeli). */
export type EconomyQuoteBundle = {
  ts: string;
  source: string | null;
  quotes: Record<string, EconomyQuote>;
  remaining: number | null;
};

/** `/economy/quotes` `group` filtresi. */
export type EconomyQuoteGroup = "fx" | "metal";

/** `/news/{ticker}` haberi (`Article` dataclass'ı). */
export type NewsArticle = {
  url: string;
  title: string;
  lang: string | null;
  date: string | null;
};

/** `GET /api/v1/companies/search` tek sonuç (`services/search.py`). */
export type CompanySearchResult = {
  ticker: string;
  name: string;
  score: number;
};

/**
 * `/api/v1/ipos/*` liste öğesi (`clients/ipo.py::list_ipos`).
 *
 * Backend `json.loads(...)` ile WordPress listesini aynen döndürür; alan
 * adları tel formatıdır ve `response_model` yoktur.
 */
export type IpoListItem = {
  id: number;
  slug: string;
  title: string;
  link: string;
  date: string;
  modified: string | null;
};

/** Halka arzın listedeki kategorisi; tek tabloda durum sütunu için. */
export type IpoStatus = "active" | "upcoming" | "draft";

/** Durum etiketiyle birleştirilmiş halka arz satırı. */
export type IpoRow = IpoListItem & { status: IpoStatus };

/** `GET /api/v1/ipos/{slug}` detayı (`clients/ipo.py::get_ipo_detail`). */
export type IpoDetail = {
  slug: string;
  ticker: string | null;
  company_name: string | null;
  info: Record<string, string>;
  sections: Record<string, string>;
  company: {
    city?: string;
    founded?: string;
    description?: string;
  };
  updated_at: string | null;
};
