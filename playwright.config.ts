/**
 * Playwright E2E yapılandırması (Faz 6 / Birim 6.1a).
 *
 * İki web sunucusu ayağa kaldırılır:
 *   1) Deterministik stub backend (127.0.0.1:7055),
 *   2) Üretim derlemesini sunan Next (`next start`, localhost:3100); BFF ve
 *      sunucu fetch'leri `API_BASE_URL` üzerinden stub'a gider.
 *
 * Next tarayıcı menşeini (baseURL) `localhost` olarak kullanır: BFF'nin aynı-
 * kaynak (CSRF) denetimi `request.nextUrl.origin` ile karşılaştırır ve
 * `next start` bu değeri yerelde `http://localhost:3100` üretir. `127.0.0.1`
 * ile gezinilirse POST istekleri `error_csrf_origin_mismatch` ile reddedilir;
 * bu yüzden baseURL localhost'tur (stub yine 127.0.0.1'dedir).
 *
 * `npm run build` E2E'den ÖNCE manuel çalıştırılır (CI'da ayrı adım); burada
 * yalnızca `next start` başlatılır. Testler tek worker'da (workers: 1) koşar:
 * stub'ta piyasa aç/kapat gibi paylaşılan durum söz konusu olduğundan
 * paralellik determinizmi bozar.
 */
import { defineConfig, devices } from "@playwright/test";

const NEXT_HOST = "localhost";
const STUB_HOST = "127.0.0.1";
const NEXT_PORT = 3100;
const STUB_PORT = 7055;
const BASE_URL = `http://${NEXT_HOST}:${NEXT_PORT}`;
const STUB_URL = `http://${STUB_HOST}:${STUB_PORT}`;

/**
 * Varsayılan bağlamda çerez izni verilmiş kabul edilir: banner tüm E2E
 * akışlarında ve görsel baseline'larda görünmez (S-04). Banner'a özel test
 * `storageState`'i boşaltarak bu durumu geçersiz kılar (`e2e/consent.spec.ts`).
 * Değer `src/lib/consent.ts` ile aynı şemadadır (sürümlü JSON, URL-encoded).
 */
const CONSENT_COOKIE_VALUE = encodeURIComponent(
  JSON.stringify({ v: 1, analytics: false }),
);

/** `webServer.env` tam bir ortam bekler; `undefined` değerler ayıklanır. */
const serverEnv: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
  if (value !== undefined) {
    serverEnv[key] = value;
  }
}
serverEnv.API_BASE_URL = STUB_URL;
serverEnv.NEXT_PUBLIC_SITE_URL = BASE_URL;
serverEnv.PORT = String(NEXT_PORT);
// Görsel regresyon (Birim 6.1b) deterministik olsun diye stub'ın veri saati
// sabitlenir: bülten tarihi, "veri zamanı" ve haber tarihleri günden/andan
// bağımsız kalır. Auth token ömrü gerçek saatle hesaplandığından (bkz.
// e2e/stub-backend.mjs `makeAccessToken`) oturum testleri etkilenmez.
serverEnv.STUB_FIXED_NOW = "2026-01-15T10:30:00+03:00";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    // Uygulama varsayılanı tr'dir; Accept-Language ile zorlanır (i18n çerez →
    // başlık → varsayılan sırasını izler). Saat dilimi bülten günü için önemli.
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "on-first-retry",
    storageState: {
      cookies: [
        {
          name: "florence_consent",
          value: CONSENT_COOKIE_VALUE,
          domain: NEXT_HOST,
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/stub-backend.mjs",
      url: `${STUB_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      name: "stub-backend",
      env: { ...serverEnv },
    },
    {
      command: "npm run start",
      url: `${BASE_URL}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: serverEnv,
      name: "next",
    },
  ],
});
