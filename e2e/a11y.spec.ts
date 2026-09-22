/**
 * Erişilebilirlik (axe) taraması (Faz 6 / Birim 6.1b, plan A-07).
 *
 * Public (anonim) ve oturumlu kritik sayfalar `@axe-core/playwright` ile
 * taranır. Kapı: hiçbir sayfada **critical** veya **serious** ihlal olmamalı.
 * `moderate`/`minor` bulgular testi düşürmez; rapora taşınmak üzere konsola
 * listelenir.
 *
 * Bilinçli istisnalar `disableRules` ile ve gerekçesiyle verilir; böylece
 * istisnanın kapsamı dar ve görünür kalır.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { resetStub, signIn } from "./helpers";

/** Kapıyı düşüren önem dereceleri. */
const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

/**
 * Sayfayı tarar; critical/serious yokluğunu doğrular ve kalan bulguları
 * özetler. `axe` yalnızca render edilmiş DOM'u gördüğü için çağrıdan önce
 * sayfanın oturması beklenir.
 */
async function expectNoBlockingViolations(page: Page, label: string): Promise<void> {
  // İstemci hidrasyonu ve ilk veri istekleri otursun: yarı-hidrate bir DOM'da
  // taranmak nadiren sahte ihlal üretebiliyor (ör. henüz bağlanmamış combobox).
  // `/dashboard` gibi sayfalar sürekli poll ettiği için ağ asla tam "idle"
  // olmaz; bu yüzden bekleme SINIRLIDIR ve başarısız olursa yutulur.
  await page.waitForLoadState("networkidle", { timeout: 3_000 }).catch(() => undefined);
  const results = await new AxeBuilder({ page }).analyze();

  const blocking = results.violations.filter((violation) =>
    BLOCKING_IMPACTS.has(violation.impact ?? ""),
  );
  const advisory = results.violations.filter(
    (violation) => !BLOCKING_IMPACTS.has(violation.impact ?? ""),
  );

  if (advisory.length > 0) {
    // Bilgilendirme amaçlı; kapıyı düşürmez. Rapor §(a) bu listeden türetildi.
    const summary = advisory
      .map((violation) => {
        const targets = violation.nodes
          .flatMap((node) => node.target)
          .map((target) => String(target))
          .join(", ");
        return `  - [${violation.impact}] ${violation.id}: ${violation.help} → ${targets}`;
      })
      .join("\n");
    console.log(`[a11y:${label}] moderate/minor bulgular:\n${summary}`);
  }

  expect(
    blocking,
    `${label} sayfasında critical/serious axe ihlali:\n${blocking
      .map((violation) => `  - [${violation.impact}] ${violation.id}: ${violation.help}`)
      .join("\n")}`,
  ).toEqual([]);
}

test.beforeEach(async ({ request }) => {
  await resetStub(request);
});

test.describe("Anonim sayfalar", () => {
  test("/ (landing) erişilebilir", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /BIST'i canlı izle/ })).toBeVisible();
    await expectNoBlockingViolations(page, "/");
  });

  test("/markets erişilebilir", async ({ page }) => {
    await page.goto("/markets");
    await expect(page.getByRole("heading", { name: "Piyasalar" })).toBeVisible();
    await expect(page.getByRole("row", { name: /THYAO/ })).toBeVisible();
    await expectNoBlockingViolations(page, "/markets");
  });

  test("/symbol/THYAO erişilebilir", async ({ page }) => {
    await page.goto("/symbol/THYAO");
    await expect(page.getByRole("heading", { name: /THYAO/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Genel" })).toBeVisible();
    await expectNoBlockingViolations(page, "/symbol/THYAO");
  });

  test("/digest erişilebilir", async ({ page }) => {
    await page.goto("/digest");
    await expect(page.getByRole("heading", { name: "Piyasa Bülteni" })).toBeVisible();
    await expectNoBlockingViolations(page, "/digest");
  });
});

test.describe("Oturumlu sayfalar", () => {
  test("/dashboard erişilebilir", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { name: "Genel Bakış" })).toBeVisible();
    await expectNoBlockingViolations(page, "/dashboard");
  });

  test("/portfolio erişilebilir", async ({ page }) => {
    await signIn(page);
    await page.goto("/portfolio");
    await expect(page.getByRole("heading", { name: "Portföyler" })).toBeVisible();
    await expectNoBlockingViolations(page, "/portfolio");
  });

  test("/profile erişilebilir", async ({ page }) => {
    await signIn(page);
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Profil" })).toBeVisible();
    await expectNoBlockingViolations(page, "/profile");
  });
});
