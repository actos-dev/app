#!/usr/bin/env node
/**
 * Deterministik stub backend (Faz 6 / Birim 6.1a).
 *
 * Playwright E2E testlerinde Next'in `API_BASE_URL` olarak gösterdiği sahte
 * backend. Yeni bir bağımlılık YOKTUR: yalnızca Node `http` kullanılır.
 *
 * Amaç: gerçek backend'e/DB'ye ihtiyaç duymadan uygulamanın kritik akışlarını
 * (anonim gezinme, aksiyon kapısı, auth, portföy al/sat, seans kapısı)
 * uçtan uca koşturabilmek. Durum (favoriler, portföyler, pozisyonlar) istekler
 * arasında KORUNUR; böylece akışlar anlamlıdır.
 *
 * Test-only kontrol uçları `/__control/*` altındadır: durum sıfırlama, piyasa
 * aç/kapat, fixture seçimi ve hızlı portföy kurulumu.
 *
 * Not: `/market/status` yanıtının `as_of` değeri KASITLI olarak geçmişe
 * ayarlanır. Next'in sunucu tarafı veri önbelleği (`revalidate: 30`) testler
 * arası paylaşıldığından, istemcinin (React Query `staleTime: 30s`) durumu
 * mutlaka tazelemesini garanti etmek için bu gereklidir; aksi halde kapatma
 * senaryosu önbellekten "açık" görebilirdi.
 */
import { createServer } from "node:http";

const PORT = Number.parseInt(process.env.STUB_PORT ?? "7055", 10);
const HOST = "127.0.0.1";

/** E2E'de kullanılan sabit kullanıcı; testlerle paylaşılır (bkz. e2e/helpers.ts). */
const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "demo123456";
const DEMO_EMAIL = "demo@florence.test";
const ACCESS_TOKEN_TTL_SECONDS = 3600;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 3600;
const COMMISSION_RATE = 0.001;

/**
 * Sabit "veri saati" (opsiyonel). Görsel regresyonun gün/saatten bağımsız
 * olması için `STUB_FIXED_NOW` verilirse TÜM veri zaman damgaları (as_of,
 * bülten tarihi, haber tarihi) bu ana sabitlenir. Auth token ömrü KASITLI
 * olarak gerçek saatle hesaplanır (`makeAccessToken`), aksi halde oturum
 * testleri sabit geçmiş tarih yüzünden süresi dolmuş token üretirdi.
 * Ayarlanmazsa davranış değişmez.
 */
const FIXED_NOW = process.env.STUB_FIXED_NOW ? new Date(process.env.STUB_FIXED_NOW) : null;

/** Veri zaman damgaları için "şimdi"; sabit saat varsa onu döner. */
function dataNow() {
  return FIXED_NOW ? new Date(FIXED_NOW.getTime()) : new Date();
}

/** Next `revalidate`'i aşacak kadar eski bir zaman damgası (tazeleme zorlaması). */
function statusAsOf() {
  return new Date(dataNow().getTime() - 120_000).toISOString();
}

function nowIso() {
  return dataNow().toISOString();
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function base64url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

/** `isAccessTokenExpired` imzasız `exp` okunduğu için geçerli bir JWT üretir. */
function makeAccessToken() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ user_id: 1, iat: issuedAt, exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS }),
  );
  return `${header}.${payload}.stub-signature`;
}

// ---------------------------------------------------------------------------
// Fixture verisi
// ---------------------------------------------------------------------------

/** Sabit hisse evreni; fiyat/değişim deterministiktir. */
const COMPANY_FIXTURES = [
  { ticker: "THYAO", name: "Türk Hava Yolları", sector: "Ulaştırma", price: 300.5, changePct: 2.35, volume: 12_000_000, marketCap: 420_000_000_000 },
  { ticker: "ASELS", name: "Aselsan", sector: "Teknoloji", price: 75.2, changePct: -1.1, volume: 8_000_000, marketCap: 180_000_000_000 },
  { ticker: "GARAN", name: "Garanti BBVA", sector: "Finans", price: 120.0, changePct: 0.75, volume: 20_000_000, marketCap: 500_000_000_000 },
  { ticker: "AKBNK", name: "Akbank", sector: "Finans", price: 68.4, changePct: -0.5, volume: 15_000_000, marketCap: 350_000_000_000 },
  { ticker: "EREGL", name: "Ereğli Demir Çelik", sector: "Sanayi", price: 35.9, changePct: 1.2, volume: 9_500_000, marketCap: 125_000_000_000 },
];

function buildCompanySummary(fixture) {
  const previousClose = round2(fixture.price / (1 + fixture.changePct / 100));
  return {
    ticker: fixture.ticker,
    name: fixture.name,
    sector: fixture.sector,
    last_price: fixture.price,
    change_pct: fixture.changePct,
    previous_close: previousClose,
    absolute_change: round2(fixture.price - previousClose),
    change_window: "last_session_change",
    market_status: "open",
    is_stale: false,
    as_of: nowIso(),
    previous_close_as_of: nowIso(),
    day_high: round2(fixture.price * 1.01),
    day_low: round2(fixture.price * 0.99),
    volume: fixture.volume,
    market_cap: fixture.marketCap,
    currency: "TRY",
    price_updated_at: nowIso(),
  };
}

function buildCompanyInfo(fixture) {
  const summary = buildCompanySummary(fixture);
  return {
    symbol: fixture.ticker,
    name: fixture.name,
    sector: fixture.sector,
    industry: fixture.sector,
    currency: "TRY",
    exchange: "IST",
    market: {
      currentPrice: summary.last_price,
      previousClose: summary.previous_close,
      marketCap: summary.market_cap,
      dayHigh: summary.day_high,
      dayLow: summary.day_low,
      regularMarketVolume: summary.volume,
      fiftyTwoWeekHigh: round2(fixture.price * 1.4),
      fiftyTwoWeekLow: round2(fixture.price * 0.6),
      regularMarketTime: Math.floor(dataNow().getTime() / 1000),
    },
    trading: {
      beta: 1.1,
      sharesOutstanding: 1_000_000_000,
      floatShares: null,
      averageVolume: fixture.volume,
      averageVolume10days: null,
      fiftyDayAverage: round2(fixture.price * 0.98),
      twoHundredDayAverage: round2(fixture.price * 0.9),
      shortRatio: null,
      heldPercentInsiders: null,
      heldPercentInstitutions: null,
    },
    valuation: {
      trailingPE: 8.5,
      forwardPE: 7.2,
      pegRatio: null,
      priceToBook: 1.5,
      priceToSalesTrailing12Months: null,
      enterpriseValue: null,
      enterpriseToEbitda: null,
      enterpriseToRevenue: null,
      bookValue: null,
      trailingEps: 5.2,
      forwardEps: null,
      dividendYield: null,
      payoutRatio: null,
      targetMeanPrice: round2(fixture.price * 1.15),
      targetHighPrice: null,
      targetLowPrice: null,
      recommendationKey: "buy",
      numberOfAnalystOpinions: 12,
    },
    financials: {
      totalRevenue: 10_000_000_000,
      revenuePerShare: null,
      revenueGrowth: 0.12,
      grossProfits: null,
      grossMargins: 0.25,
      ebitda: 2_000_000_000,
      ebitdaMargins: null,
      netIncomeToCommon: 1_500_000_000,
      profitMargins: 0.15,
      operatingMargins: null,
      operatingCashflow: null,
      freeCashflow: null,
      earningsGrowth: null,
      earningsQuarterlyGrowth: null,
      returnOnEquity: 0.18,
      returnOnAssets: null,
    },
    balanceSheet: {
      totalCash: 5_000_000_000,
      totalCashPerShare: null,
      totalDebt: 3_000_000_000,
      debtToEquity: 0.6,
      currentRatio: 1.8,
      quickRatio: 1.3,
    },
    recommendations: [
      { period: "0m", strongBuy: 4, buy: 5, hold: 3, sell: 0, strongSell: 0 },
    ],
  };
}

/** Deterministik mum serisi üretir (fiyat etrafında hafif salınım). */
function buildCandles(basePrice, count) {
  const candles = [];
  for (let index = 0; index < count; index += 1) {
    const wave = Math.sin(index / 2) * 0.02;
    const close = round2(basePrice * (1 + wave));
    candles.push({
      ts: new Date(dataNow().getTime() - (count - index) * 86_400_000).toISOString(),
      open: round2(close * 0.995),
      high: round2(close * 1.01),
      low: round2(close * 0.99),
      close,
      volume: 1_000_000 + index * 1000,
    });
  }
  return candles;
}

function buildNews(ticker) {
  return [
    {
      url: "https://ornek.test/haber-1",
      title: `${ticker} için piyasa özeti`,
      lang: "tr",
      date: nowIso(),
    },
    {
      url: "https://ornek.test/haber-2",
      title: `${ticker} analist değerlendirmesi`,
      lang: "tr",
      date: nowIso(),
    },
  ];
}

/** FX + kıymetli maden evreni; grup ve `symbols` filtresi bunu kullanır. */
const ECONOMY_FIXTURES = {
  USD: { price: 41.5, buying: 41.4, selling: 41.6, changePct: 0.2, unit: "1 USD" },
  EUR: { price: 45.1, buying: 45.0, selling: 45.2, changePct: -0.1, unit: "1 EUR" },
  GBP: { price: 52.4, buying: 52.3, selling: 52.5, changePct: 0.05, unit: "1 GBP" },
  "XAU-GRAM": { price: 3450.0, buying: 3448.0, selling: 3452.0, changePct: 0.9, unit: "gram" },
  "XAG-GRAM": { price: 42.5, buying: 42.4, selling: 42.6, changePct: 1.4, unit: "gram" },
};

const ECONOMY_GROUPS = {
  fx: ["USD", "EUR", "GBP"],
  metal: ["XAU-GRAM", "XAG-GRAM"],
};

function buildEconomyQuote(symbol) {
  const fixture = ECONOMY_FIXTURES[symbol];
  return {
    symbol,
    buying: fixture.buying,
    selling: fixture.selling,
    price: fixture.price,
    change_pct: fixture.changePct,
    change_text: `%${fixture.changePct}`,
    currency: "TRY",
    unit: fixture.unit,
    source: "stub",
    ts: nowIso(),
    stale: false,
    extra: {},
  };
}

function buildIpo(slug, title, id) {
  return {
    id,
    slug,
    title,
    link: `https://ornek.test/ipo/${slug}`,
    date: nowIso(),
    modified: nowIso(),
  };
}

function buildDigest(date, slot) {
  const slotTitles = { morning: "Sabah Bülteni", noon: "Öğle Bülteni", evening: "Akşam Bülteni" };
  return {
    id: `digest-${date}-${slot}`,
    date,
    slot,
    title: slotTitles[slot] ?? "Piyasa Bülteni",
    content: "## Piyasa Özeti\n\nBIST günü yükselişle kapandı.",
    sections: [{ heading: "Özet", body: "Endeks günü pozitif tamamladı." }],
    metadata: { slot },
    language: "tr",
    created_at: nowIso(),
  };
}

/** İstanbul takvim günü (`YYYY-MM-DD`); bülten tarihi için. */
function todayInIstanbul() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dataNow());
  const read = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

// ---------------------------------------------------------------------------
// Değişken durum (istekler arasında korunur)
// ---------------------------------------------------------------------------

const defaultState = () => ({
  marketOpen: true,
  scenario: "default",
  companies: COMPANY_FIXTURES.map((fixture) => fixture.ticker),
  favorites: [],
  portfolios: new Map(),
  nextPortfolioId: 1,
  userType: "user",
});

let state = defaultState();

function resetState() {
  state = defaultState();
}

/** Reset sonrası üretilen oturumlu kullanıcının profili. */
function buildProfile() {
  return {
    username: DEMO_USERNAME,
    email: DEMO_EMAIL,
    user_type: state.userType,
    created_at: "2026-01-01T10:00:00.000Z",
    email_verified: true,
    avatar_id: null,
    credits: 25,
  };
}

function companyByTicker(ticker) {
  return COMPANY_FIXTURES.find((fixture) => fixture.ticker === ticker) ?? null;
}

function economyPrice(symbol) {
  const fixture = ECONOMY_FIXTURES[symbol];
  return fixture ? fixture.price : null;
}

/** Portföyün güncel değerlemesi; pozisyon yokken nakit = toplam. */
function valuationOf(portfolio) {
  const assets = [];
  let holdingsValue = 0;

  for (const [ticker, holding] of portfolio.holdings) {
    const fixture = companyByTicker(ticker);
    const currentPrice = fixture ? fixture.price : null;
    const totalValue = currentPrice === null ? null : round2(currentPrice * holding.quantity);
    const totalCost = round2(holding.cost);
    const pnl = currentPrice === null ? null : round2(totalValue - totalCost);
    assets.push({
      ticker,
      amount: holding.quantity,
      current_price: currentPrice,
      total_value: totalValue,
      total_cost: totalCost,
      weighted_avg_cost: round2(holding.cost / holding.quantity),
      unrealized_pnl: pnl,
      unrealized_pnl_pct:
        currentPrice === null || totalCost === 0 ? null : round2((pnl / totalCost) * 100),
    });
    if (totalValue !== null) {
      holdingsValue += totalValue;
    }
  }

  const cash = portfolio.metadata.balance;
  const totalValue = round2(cash + holdingsValue);
  const costBasis = portfolio.metadata.initial_balance;
  return {
    total_value: totalValue,
    cash_balance: round2(cash),
    holdings_value: round2(holdingsValue),
    total_pnl: round2(totalValue - costBasis),
    pnl_percentage: costBasis === 0 ? null : round2(((totalValue - costBasis) / costBasis) * 100),
    assets,
  };
}

function summaryOf(portfolio) {
  const valuation = valuationOf(portfolio);
  return {
    id: portfolio.metadata.id,
    name: portfolio.metadata.name,
    currency: "TRY",
    created_at: portfolio.metadata.created_at,
    current_value: valuation.total_value,
    cost_basis: portfolio.metadata.initial_balance,
    daily_change_pct: 0,
    total_return_pct: valuation.pnl_percentage,
    position_count: portfolio.holdings.size,
    as_of: nowIso(),
  };
}

function createPortfolio(name, initialBalance) {
  const id = `p${state.nextPortfolioId}`;
  state.nextPortfolioId += 1;
  const portfolio = {
    metadata: {
      id,
      user_id: 1,
      name,
      initial_balance: initialBalance,
      balance: initialBalance,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    transactions: [],
    holdings: new Map(),
  };
  state.portfolios.set(id, portfolio);
  return portfolio;
}

// ---------------------------------------------------------------------------
// HTTP yardımcıları
// ---------------------------------------------------------------------------

function sendJson(response, status, body, extraHeaders = {}) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...extraHeaders,
  };
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

async function readJson(request) {
  const raw = await readBody(request);
  if (raw.trim().length === 0) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** `Cookie` başlığını ada göre okur (basit ayrıştırıcı). */
function cookieValue(request, name) {
  const header = request.headers.cookie;
  if (!header) {
    return null;
  }
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index).trim() === name) {
      return part.slice(index + 1).trim();
    }
  }
  return null;
}

function loginCookies() {
  return [
    `access_token=${makeAccessToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ACCESS_TOKEN_TTL_SECONDS}`,
    `refresh_token=stub-refresh-token; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=${REFRESH_TOKEN_TTL_SECONDS}`,
  ];
}

function clearedCookies() {
  return [
    "access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    "refresh_token=; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=0",
  ];
}

function authenticated(request) {
  return cookieValue(request, "access_token") !== null;
}

// ---------------------------------------------------------------------------
// Eşleştirme yardımcıları
// ---------------------------------------------------------------------------

/** Tek segmentli dinamik parçayı çözer; eşleşmezse `null`. */
function segmentAfter(pathname, prefix, suffix = "") {
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  let rest = pathname.slice(prefix.length);
  if (suffix.length > 0) {
    if (!rest.endsWith(suffix)) {
      return null;
    }
    rest = rest.slice(0, -suffix.length);
  }
  if (rest.length === 0 || rest.includes("/")) {
    return null;
  }
  return decodeURIComponent(rest);
}

function sortCompanies(companies, sort) {
  const sorted = [...companies];
  switch (sort) {
    case "alphabetical":
      sorted.sort((a, b) => a.ticker.localeCompare(b.ticker));
      break;
    case "gainers":
      sorted.sort((a, b) => b.change_pct - a.change_pct);
      break;
    case "losers":
      sorted.sort((a, b) => a.change_pct - b.change_pct);
      break;
    case "price_high":
      sorted.sort((a, b) => (b.last_price ?? 0) - (a.last_price ?? 0));
      break;
    case "price_low":
      sorted.sort((a, b) => (a.last_price ?? 0) - (b.last_price ?? 0));
      break;
    case "volume":
      sorted.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
      break;
    case "market_cap":
      sorted.sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0));
      break;
    default:
      break;
  }
  return sorted;
}

/** Piyasa durumu; kapalıyken ertesi gün 10:00'a işaret eder. */
function buildMarketStatus() {
  const open = state.marketOpen;
  const nextOpen = dataNow();
  nextOpen.setDate(nextOpen.getDate() + 1);
  nextOpen.setHours(10, 0, 0, 0);
  return {
    open,
    next_open_at: open ? null : nextOpen.toISOString(),
    timezone: "Europe/Istanbul",
    is_holiday: false,
    holiday_name: null,
    as_of: statusAsOf(),
  };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
  const pathname = url.pathname;
  const method = request.method ?? "GET";

  try {
    // --- Test-only kontrol uçları -----------------------------------------
    if (method === "GET" && pathname === "/health") {
      return sendJson(response, 200, { ok: true });
    }
    if (pathname === "/__control/reset" && method === "POST") {
      resetState();
      return sendJson(response, 200, { ok: true });
    }
    if (pathname === "/__control/market" && method === "POST") {
      const body = await readJson(request);
      state.marketOpen = body.open !== false;
      return sendJson(response, 200, { ok: true, open: state.marketOpen });
    }
    if (pathname === "/__control/user" && method === "POST") {
      const body = await readJson(request);
      state.userType = typeof body.user_type === "string" ? body.user_type : "user";
      return sendJson(response, 200, { ok: true, user_type: state.userType });
    }
    if (pathname === "/__control/fixture" && method === "POST") {
      const body = await readJson(request);
      state.scenario = typeof body.scenario === "string" ? body.scenario : "default";
      state.companies =
        state.scenario === "empty" ? [] : COMPANY_FIXTURES.map((fixture) => fixture.ticker);
      return sendJson(response, 200, { ok: true, scenario: state.scenario });
    }
    if (pathname === "/__control/portfolio" && method === "POST") {
      const body = await readJson(request);
      const portfolio = createPortfolio(
        typeof body.name === "string" ? body.name : "Test Portföyü",
        typeof body.balance === "number" ? body.balance : 100000,
      );
      return sendJson(response, 200, { id: portfolio.metadata.id });
    }

    // --- Piyasa durumu -----------------------------------------------------
    if (method === "GET" && pathname === "/api/v1/market/status") {
      return sendJson(response, 200, buildMarketStatus());
    }

    // --- Auth --------------------------------------------------------------
    if (method === "POST" && pathname === "/api/v1/auth/login") {
      const raw = await readBody(request);
      const form = new URLSearchParams(raw);
      const username = form.get("username") ?? "";
      const password = form.get("password") ?? "";
      const validUser = username === DEMO_USERNAME || username === DEMO_EMAIL;
      if (!validUser || password !== DEMO_PASSWORD) {
        return sendJson(response, 400, { detail: "error_login_failed" });
      }
      return sendJson(
        response,
        200,
        { access_token: makeAccessToken(), token_type: "bearer" },
        { "set-cookie": loginCookies() },
      );
    }
    if (method === "POST" && pathname === "/api/v1/auth/register") {
      await readJson(request);
      return sendJson(response, 200, { verification_sent: true });
    }
    if (method === "POST" && pathname === "/api/v1/auth/refresh") {
      if (cookieValue(request, "refresh_token") === null) {
        return sendJson(response, 401, { detail: "Invalid or expired refresh token" });
      }
      return sendJson(response, 200, { access_token: makeAccessToken() }, { "set-cookie": loginCookies() });
    }
    if (method === "POST" && pathname === "/api/v1/auth/logout") {
      return sendJson(response, 200, { ok: true }, { "set-cookie": clearedCookies() });
    }
    if (method === "GET" && pathname === "/api/v1/auth/verify-email") {
      return sendJson(response, 200, { ok: true });
    }
    if (method === "POST" && pathname === "/api/v1/auth/resend-verification") {
      await readJson(request);
      return sendJson(response, 200, { sent: true });
    }

    // --- Oturum gerektiren uçlar ------------------------------------------
    if (method === "GET" && pathname === "/api/v1/profile") {
      if (!authenticated(request)) {
        return sendJson(response, 401, { detail: "error_unauthorized" });
      }
      return sendJson(response, 200, buildProfile());
    }
    if (method === "GET" && pathname === "/api/v1/credits") {
      if (!authenticated(request)) {
        return sendJson(response, 401, { detail: "error_unauthorized" });
      }
      return sendJson(response, 200, { credits: 25 });
    }
    if (method === "GET" && pathname === "/api/v1/announcements") {
      if (!authenticated(request)) {
        return sendJson(response, 401, { detail: "error_unauthorized" });
      }
      return sendJson(response, 200, { announcements: [] });
    }
    if (pathname === "/api/v1/favorites" && method === "GET") {
      if (!authenticated(request)) {
        return sendJson(response, 401, { detail: "error_unauthorized" });
      }
      return sendJson(response, 200, { favorites: state.favorites });
    }
    const favoriteTicker =
      segmentAfter(pathname, "/api/v1/favorites/") ?? null;
    if (favoriteTicker !== null && (method === "POST" || method === "DELETE")) {
      if (!authenticated(request)) {
        return sendJson(response, 401, { detail: "error_unauthorized" });
      }
      const ticker = favoriteTicker.toUpperCase();
      if (method === "POST") {
        if (!state.favorites.includes(ticker)) {
          state.favorites.push(ticker);
        }
      } else {
        state.favorites = state.favorites.filter((item) => item !== ticker);
      }
      return sendJson(response, 200, { favorites: state.favorites });
    }

    // --- Piyasa okuma ------------------------------------------------------
    if (method === "GET" && pathname === "/api/v1/companies/summary") {
      const sort = url.searchParams.get("sort") ?? "popular";
      const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
      const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
      const tickersParam = url.searchParams.get("tickers");

      let companies = state.companies
        .map((ticker) => companyByTicker(ticker))
        .filter((fixture) => fixture !== null)
        .map((fixture) => buildCompanySummary(fixture));
      if (tickersParam !== null) {
        const wanted = tickersParam
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter((value) => value.length > 0);
        companies = companies.filter((row) => wanted.includes(row.ticker));
      }
      companies = sortCompanies(companies, sort);
      const total = companies.length;
      const page = companies.slice(offset, offset + (Number.isNaN(limit) ? 50 : limit));
      return sendJson(response, 200, { data: page, total });
    }

    const infoTicker = segmentAfter(pathname, "/api/v1/companies/info/");
    if (method === "GET" && infoTicker !== null) {
      const fixture = companyByTicker(infoTicker.toUpperCase());
      if (!fixture) {
        return sendJson(response, 404, { detail: "error_invalid_ticker" });
      }
      return sendJson(response, 200, buildCompanyInfo(fixture));
    }

    if (method === "GET" && pathname === "/api/v1/companies/search") {
      const query = (url.searchParams.get("query") ?? "").trim().toUpperCase();
      const matches = COMPANY_FIXTURES.filter(
        (fixture) =>
          fixture.ticker.includes(query) || fixture.name.toUpperCase().includes(query),
      ).map((fixture) => ({ ticker: fixture.ticker, name: fixture.name, score: 1 }));
      return sendJson(response, 200, matches);
    }

    if (method === "GET" && pathname === "/api/v1/price/current") {
      const ticker = (url.searchParams.get("ticker") ?? "").toUpperCase();
      const fixture = companyByTicker(ticker);
      if (!fixture) {
        return sendJson(response, 404, { detail: "error_invalid_ticker" });
      }
      const summary = buildCompanySummary(fixture);
      return sendJson(response, 200, {
        ticker: summary.ticker,
        price: summary.last_price,
        previous_close: summary.previous_close,
        absolute_change: summary.absolute_change,
        change_pct: summary.change_pct,
        as_of: summary.as_of,
        previous_close_as_of: summary.previous_close_as_of,
        market_status: "open",
        is_stale: false,
        change_window: summary.change_window,
        interval: "1d",
      });
    }

    const historyTicker =
      segmentAfter(pathname, "/api/v1/price/history/") ??
      segmentAfter(pathname, "/api/v1/economy/history/");
    if (method === "GET" && historyTicker !== null) {
      const fixture = companyByTicker(historyTicker.toUpperCase());
      const base = fixture ? fixture.price : economyPrice(historyTicker);
      if (base === null) {
        return sendJson(response, 404, { detail: "error_invalid_ticker" });
      }
      return sendJson(response, 200, buildCandles(base, 24));
    }

    const newsTicker = segmentAfter(pathname, "/api/v1/news/");
    if (method === "GET" && newsTicker !== null) {
      return sendJson(response, 200, buildNews(newsTicker.toUpperCase()));
    }

    if (method === "GET" && pathname === "/api/v1/economy/quotes") {
      const group = url.searchParams.get("group");
      const symbolsParam = url.searchParams.get("symbols");
      let symbols;
      if (symbolsParam !== null) {
        symbols = symbolsParam
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0 && value in ECONOMY_FIXTURES);
      } else if (group !== null && group in ECONOMY_GROUPS) {
        symbols = ECONOMY_GROUPS[group];
      } else {
        symbols = Object.keys(ECONOMY_FIXTURES);
      }
      const quotes = {};
      for (const symbol of symbols) {
        quotes[symbol] = buildEconomyQuote(symbol);
      }
      return sendJson(response, 200, { ts: nowIso(), source: "stub", quotes, remaining: null });
    }

    const ipoListPath = pathname.match(/^\/api\/v1\/ipos\/(active|upcoming|draft)$/);
    if (method === "GET" && ipoListPath) {
      const kind = ipoListPath[1];
      if (kind === "active") {
        return sendJson(response, 200, [buildIpo("ornek-ipo", "Örnek Halka Arz", 1)]);
      }
      if (kind === "upcoming") {
        return sendJson(response, 200, [buildIpo("gelecek-ipo", "Gelecek Halka Arz", 2)]);
      }
      return sendJson(response, 200, []);
    }

    const ipoDetailSlug = segmentAfter(pathname, "/api/v1/ipos/");
    if (method === "GET" && ipoDetailSlug !== null) {
      return sendJson(response, 200, {
        slug: ipoDetailSlug,
        ticker: null,
        company_name: "Örnek Halka Arz",
        info: {},
        sections: {},
        company: {},
        updated_at: nowIso(),
      });
    }

    if (method === "GET" && pathname === "/api/v1/digest") {
      const date = url.searchParams.get("date") ?? todayInIstanbul();
      const slot = url.searchParams.get("slot");
      const at = url.searchParams.get("at");
      if (at !== null) {
        // "Şu an hangi pencere?" sorusu: güncel bültenin aynısını döndür.
        return sendJson(response, 200, buildDigest(date, "morning"));
      }
      if (slot !== null) {
        if (!["morning", "noon", "evening"].includes(slot)) {
          return sendJson(response, 404, { detail: "error_not_found" });
        }
        return sendJson(response, 200, buildDigest(date, slot));
      }
      if (url.searchParams.has("date")) {
        return sendJson(response, 200, [buildDigest(date, "morning")]);
      }
      return sendJson(response, 200, buildDigest(date, "morning"));
    }

    // --- Portföyler --------------------------------------------------------
    if (pathname === "/api/v1/portfolios" && method === "GET") {
      if (!authenticated(request)) {
        return sendJson(response, 401, { detail: "error_unauthorized" });
      }
      const portfolios = Array.from(state.portfolios.values()).map((portfolio) => ({
        metadata: portfolio.metadata,
        transactions: portfolio.transactions,
      }));
      return sendJson(response, 200, portfolios);
    }
    if (pathname === "/api/v1/portfolios" && method === "POST") {
      if (!authenticated(request)) {
        return sendJson(response, 401, { detail: "error_unauthorized" });
      }
      const body = await readJson(request);
      const portfolio = createPortfolio(
        typeof body.name === "string" ? body.name : "Portföy",
        typeof body.initial_balance === "number" ? body.initial_balance : 100000,
      );
      return sendJson(response, 200, {
        metadata: portfolio.metadata,
        transactions: portfolio.transactions,
      });
    }
    if (pathname === "/api/v1/portfolios/summaries" && method === "GET") {
      if (!authenticated(request)) {
        return sendJson(response, 401, { detail: "error_unauthorized" });
      }
      return sendJson(response, 200, {
        items: Array.from(state.portfolios.values()).map((portfolio) => summaryOf(portfolio)),
      });
    }

    // `/api/v1/portfolios/{id}` ve alt yolları: ilk segmenti ayır.
    let portfolioId = null;
    let portfolioRest = "";
    if (pathname.startsWith("/api/v1/portfolios/")) {
      const rest = pathname.slice("/api/v1/portfolios/".length);
      const slash = rest.indexOf("/");
      const first = slash === -1 ? rest : rest.slice(0, slash);
      portfolioRest = slash === -1 ? "" : rest.slice(slash);
      if (first.length > 0) {
        portfolioId = decodeURIComponent(first);
      }
    }
    if (portfolioId !== null) {
      if (!authenticated(request)) {
        return sendJson(response, 401, { detail: "error_unauthorized" });
      }
      const portfolio = state.portfolios.get(portfolioId);
      if (!portfolio) {
        return sendJson(response, 404, { detail: "error_portfolio_not_found" });
      }

      if (method === "GET" && portfolioRest === "") {
        return sendJson(response, 200, {
          metadata: portfolio.metadata,
          transactions: portfolio.transactions,
        });
      }
      if (method === "GET" && portfolioRest === "/valuation") {
        return sendJson(response, 200, valuationOf(portfolio));
      }
      if (method === "GET" && portfolioRest === "/transactions") {
        return sendJson(response, 200, portfolio.transactions);
      }
      if (method === "POST" && portfolioRest === "/transactions") {
        const body = await readJson(request);
        const ticker = String(body.ticker ?? "").toUpperCase();
        const type = body.type === "SELL" ? "SELL" : "BUY";
        const quantity = Number(body.quantity);

        if (!state.marketOpen) {
          return sendJson(response, 400, { detail: "error_market_closed" });
        }
        const fixture = companyByTicker(ticker);
        if (!fixture || !Number.isFinite(quantity) || quantity <= 0) {
          return sendJson(response, 400, { detail: "error_invalid_ticker" });
        }

        const price = fixture.price;
        const subtotal = round2(price * quantity);
        const commission = round2(subtotal * COMMISSION_RATE);
        const total = type === "BUY" ? round2(subtotal + commission) : round2(subtotal - commission);
        const holding = portfolio.holdings.get(ticker) ?? { quantity: 0, cost: 0 };

        if (type === "BUY") {
          portfolio.metadata.balance = round2(portfolio.metadata.balance - total);
          portfolio.holdings.set(ticker, {
            quantity: holding.quantity + quantity,
            cost: round2(holding.cost + subtotal),
          });
        } else {
          portfolio.metadata.balance = round2(portfolio.metadata.balance + total);
          const remaining = Math.max(0, holding.quantity - quantity);
          portfolio.holdings.set(ticker, {
            quantity: remaining,
            cost: round2(holding.cost - subtotal),
          });
        }
        portfolio.metadata.updated_at = nowIso();

        const transaction = {
          id: `tx${portfolio.transactions.length + 1}`,
          ticker,
          type,
          quantity,
          price,
          commission,
          total,
          date: nowIso(),
        };
        portfolio.transactions.push(transaction);
        return sendJson(response, 200, transaction);
      }
      if (method === "DELETE" && portfolioRest === "") {
        state.portfolios.delete(portfolioId);
        return sendJson(response, 200, { ok: true });
      }
      if (method === "PUT" && portfolioRest === "") {
        const body = await readJson(request);
        if (typeof body.name === "string" && body.name.trim().length > 0) {
          portfolio.metadata.name = body.name.trim();
        }
        return sendJson(response, 200, {
          metadata: portfolio.metadata,
          transactions: portfolio.transactions,
        });
      }
      if (method === "POST" && portfolioRest === "/duplicate") {
        const copy = createPortfolio(
          `${portfolio.metadata.name} (kopya)`,
          portfolio.metadata.initial_balance,
        );
        copy.metadata.balance = portfolio.metadata.balance;
        for (const [ticker, holding] of portfolio.holdings) {
          copy.holdings.set(ticker, { ...holding });
        }
        return sendJson(response, 200, { metadata: copy.metadata, transactions: [] });
      }
    }

    return sendJson(response, 404, { detail: "error_not_found" });
  } catch (error) {
    return sendJson(response, 500, {
      detail: "error_stub_internal",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`[stub-backend] http://${HOST}:${PORT} dinleniyor\n`);
});
