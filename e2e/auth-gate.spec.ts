/**
 * Anonim aksiyon kapısı ve kilitli navigasyon (Faz 6 / Birim 6.1a, plan X-03/X-04).
 *
 * Kişisel nav öğeleri anonimde kilitli görünür ve `/login?next=` hedefine
 * gider; kişisel aksiyonlar (favori) tıklanınca yine girişe yönlendirir ve
 * dönüş yolu korunur.
 */
import { expect, test } from "@playwright/test";

import { resetStub } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetStub(request);
});

test.describe("Anonim aksiyon kapısı", () => {
  test("kilitli kişisel nav girişe yönlendirir", async ({ page }) => {
    await page.goto("/dashboard");

    // Üst navigasyonda kişisel öğeler grup menüsünün içindedir; önce aç.
    await page.getByRole("button", { name: "Piyasa" }).click();
    const watchlistLink = page.getByRole("menuitem", { name: "Takip Listesi" });
    await expect(watchlistLink).toBeVisible();
    // Kilitli öğe `aria-disabled` taşır (erişilebilirlik için doğru); Playwright
    // bunu "enabled değil" sayar. Bu bir <a href> olduğundan gerçek tıklamayı
    // actionability beklemeden zorluyoruz: hedef yine `/login?next=`.
    await watchlistLink.click({ force: true });

    await page.waitForURL(/\/login\?next=/);
    expect(page.url()).toContain(encodeURIComponent("/watchlist"));
  });

  test("sembol sayfasındaki favori butonu girişe yönlendirir", async ({ page }) => {
    await page.goto("/symbol/THYAO");

    const favorite = page.getByRole("button", { name: "Takibe almak için giriş yap" });
    await expect(favorite).toBeVisible();
    await favorite.click();

    await page.waitForURL(/\/login\?next=/);
    expect(page.url()).toContain(encodeURIComponent("/symbol/THYAO"));
  });
});
