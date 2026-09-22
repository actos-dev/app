/**
 * Görsel regresyon (Faz 6 / Birim 6.1b, plan S-17).
 *
 * Kritik public sayfalar 3 temada (koyu/açık/sepya) ekran görüntüsüne alınır.
 * Tema sunucu tarafında `theme` çerezinden çözüldüğü için (bkz.
 * `src/i18n/config.ts`) çerez `page.goto`'dan ÖNCE eklenir; böylece SSR HTML'i
 * doğru `data-theme` ile üretilir ve hidrasyon farkı doğmaz.
 *
 * Determinizm:
 *   - `reducedMotion: "reduce"` + enjekte edilen stil ile tüm geçiş/animasyonlar
 *     durdurulur (`toHaveScreenshot` zaten `animations: "disabled"` uygular).
 *   - `deviceScaleFactor: 1` ve sabit viewport: piksel ölçeği ortamlar arası
 *     değişmez.
 *   - Stub'ın veri saati `STUB_FIXED_NOW` ile sabittir (bkz. playwright.config.ts);
 *     bülten tarihi, "veri zamanı" ve haber tarihleri koşular arası aynıdır.
 *   - `/digest` sabit `?date=` ile açılır; aksi halde arşiv tarihi günden güne
 *     değişir ve baseline her gün bayatlardı.
 *
 * Baseline'lar `--update-snapshots` ile üretilir ve
 * `e2e/visual.spec.ts-snapshots/` altında repoya commit'lenir.
 */
import { expect, test, type Page } from "@playwright/test";

import { resetStub } from "./helpers";

const THEMES = ["dark", "light", "sepia"] as const;

const PAGES = [
  { name: "landing", path: "/", ready: /BIST'i canlı izle/ },
  { name: "markets", path: "/markets", ready: "Piyasalar" },
  { name: "symbol-thyao", path: "/symbol/THYAO", ready: /THYAO/ },
  { name: "digest", path: "/digest?date=2026-01-15", ready: "Güncel bülten" },
] as const;

test.use({
  reducedMotion: "reduce",
  deviceScaleFactor: 1,
});

test.beforeEach(async ({ request }) => {
  await resetStub(request);
});

/** Sayfayı görüntü almadan önce kararlı hale getirir. */
async function stabilize(page: Page): Promise<void> {
  // Ağ sakinleşsin (fontlar, RSC prefetch, ilk veri istekleri).
  await page.waitForLoadState("networkidle");
  // Web fontları yüklenmeden alınan kare metin genişliğini kaydırır.
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Animasyon/geçiş ve imleç yanıp sönmesini dondur (çift güvence).
  await page.addStyleTag({
    content: `*,
*::before,
*::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  caret-color: transparent !important;
}`,
  });
}

for (const theme of THEMES) {
  test.describe(`Tema: ${theme}`, () => {
    for (const { name, path, ready } of PAGES) {
      test(`${name} görsel olarak kararlı`, async ({ page }) => {
        const baseURL = test.info().project.use.baseURL;
        expect(baseURL).toBeTruthy();
        await page.context().addCookies([{ name: "theme", value: theme, url: baseURL! }]);

        await page.goto(path);
        await expect(page.getByRole("heading", { name: ready }).first()).toBeVisible();
        await stabilize(page);

        await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
          // Kaydırma konumu ve küçük anti-aliasing farklarına tolerans.
          maxDiffPixelRatio: 0.01,
          fullPage: false,
        });
      });
    }
  });
}
