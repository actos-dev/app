/**
 * Çerez izni banner'ı E2E testleri (Faz 6 / Birim 6.3, plan S-04).
 *
 * Diğer testlerin aksine bu bağlamda rıza çerezi YOKTUR; banner sunucuda
 * render edilir. "Yalnızca gerekli" reddi banner'ı kalıcı kapatmalı ve çerezi
 * yazdığından telemetry'ye hiç istek gitmemelidir.
 */
import { expect, test, type Request } from "@playwright/test";

import { resetStub } from "./helpers";

// Varsayılan çerez izni bu dosyada uygulanmasın: anonim/kararsız durumu test eder.
test.use({
  storageState: { cookies: [], origins: [] },
  reducedMotion: "reduce",
  deviceScaleFactor: 1,
});

test.beforeEach(async ({ request }) => {
  await resetStub(request);
});

/** Analytics uçuna giden istekleri toplar. */
function collectAnalyticsRequests(page: import("@playwright/test").Page): Request[] {
  const requests: Request[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/analytics/event")) {
      requests.push(request);
    }
  });
  return requests;
}

test.describe("Çerez izni (S-04)", () => {
  test("rıza yokken görünür; yalnızca gerekli seçilince kaybolur ve telemetry gitmez", async ({
    page,
  }) => {
    const analyticsRequests = collectAnalyticsRequests(page);

    await page.goto("/");
    const banner = page.getByRole("region", { name: "Çerez izni" });
    await expect(banner).toBeVisible();

    // Banner'ın kendisi görsel olarak da sabitlenir (yeni bileşen baseline'ı).
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect(banner).toHaveScreenshot("consent-banner-dark.png", {
      maxDiffPixelRatio: 0.01,
    });

    await banner.getByRole("button", { name: "Yalnızca gerekli" }).click();
    await expect(banner).toBeHidden();

    // Reload sonrası karar sunucuda okunur; banner tekrar çıkmaz.
    await page.reload();
    await expect(page.getByRole("region", { name: "Çerez izni" })).toHaveCount(0);

    const cookie = (await page.context().cookies()).find(
      (item) => item.name === "florence_consent",
    );
    expect(cookie?.value).toContain("analytics");
    expect(analyticsRequests).toHaveLength(0);
  });

  test("kabul edilince izin kaydedilir ve banner kaybolur", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("region", { name: "Çerez izni" });
    await expect(banner).toBeVisible();

    await banner.getByRole("button", { name: "Kabul et" }).click();
    await expect(page.getByRole("region", { name: "Çerez izni" })).toHaveCount(0);

    const cookie = (await page.context().cookies()).find(
      (item) => item.name === "florence_consent",
    );
    expect(cookie?.value).toContain("analytics");
  });
});
