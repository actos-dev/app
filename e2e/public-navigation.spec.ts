/**
 * Anonim (girişsiz) gezinme akışları (Faz 6 / Birim 6.1a, plan X-02/X-06).
 *
 * Public-first model doğrulanır: piyasa okuma sayfaları oturum olmadan
 * SSR'dan gerçek veriyle render edilir; grafik gibi ağır istemci parçaları
 * sekme açılmadan yüklenmez.
 */
import { expect, test } from "@playwright/test";

import { resetStub } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetStub(request);
});

test.describe("Anonim gezinme", () => {
  test("landing sayfası yüklenir", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /BIST'i canlı izle/ }),
    ).toBeVisible();
  });

  test("/markets gerçek hisse satırları gösterir", async ({ page }) => {
    await page.goto("/markets");

    await expect(page.getByRole("heading", { name: "Piyasalar" })).toBeVisible();
    await expect(page.getByRole("row", { name: /THYAO/ })).toBeVisible();
    await expect(page.getByText("5 sonuç")).toBeVisible();
  });

  test("/symbol/THYAO grafik sekmesi açılmadan yüklenir", async ({ page }) => {
    await page.goto("/symbol/THYAO");

    await expect(page.getByRole("heading", { name: /THYAO/ })).toBeVisible();
    // Genel sekmesi varsayılan; grafik sekmesi var ama ağır grafik bileşeni
    // (lightweight-charts canvas'ı) yalnız sekme açılınca mount edilir.
    await expect(page.getByRole("tab", { name: "Genel" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Grafik" })).toBeVisible();
    await expect(page.getByText("Fiyat", { exact: true })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("/digest bülteni render eder", async ({ page }) => {
    await page.goto("/digest");

    await expect(page.getByRole("heading", { name: "Piyasa Bülteni" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Güncel bülten" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sabah Bülteni" })).toBeVisible();
  });
});
