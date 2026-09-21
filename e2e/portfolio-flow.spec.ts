/**
 * Portföy oluşturma ve al/sat akışı (Faz 6 / Birim 6.1a, plan 4.1/4.2).
 *
 * Akış: giriş → yeni portföy oluştur → detayda Al/Sat → sembol seç → adet gir →
 * pozisyon tablosunda görünür. Bu test stub'ın durumunu gerçekten güncellediğini
 * (pozisyonun kalıcı göründüğünü) doğrular.
 */
import { expect, test } from "@playwright/test";

import { resetStub, selectTradeSymbol, signIn } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetStub(request);
});

test.describe("Portföy akışı", () => {
  test("yeni portföy oluşturup hisse alınca pozisyon görünür", async ({ page }) => {
    await signIn(page);
    await page.goto("/portfolio");

    await page.getByRole("button", { name: "Yeni portföy", exact: true }).click();
    const createDialog = page.getByRole("dialog");
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel("Portföy adı").fill("Test Portföyü");
    await createDialog.getByLabel("Başlangıç bakiyesi").fill("100000");
    await createDialog.getByRole("button", { name: "Oluştur" }).click();
    await expect(createDialog).toBeHidden();

    const cardLink = page.getByRole("link", { name: "Test Portföyü portföyünü aç" });
    await expect(cardLink).toBeVisible();
    await cardLink.click();
    await page.waitForURL(/\/portfolio\/p\d+/);
    await expect(page.getByRole("heading", { name: "Test Portföyü" })).toBeVisible();

    await page.getByRole("button", { name: "Al / Sat" }).click();
    const tradeDialog = page.getByRole("dialog");
    await expect(tradeDialog).toBeVisible();

    await selectTradeSymbol(page, "THYAO");
    await tradeDialog.getByLabel("Adet").fill("10");
    await tradeDialog.getByRole("button", { name: "Alış emrini gönder" }).click();

    await expect(tradeDialog).toBeHidden();
    await expect(
      page
        .getByRole("table", { name: "Portföy pozisyonları" })
        .getByRole("row", { name: /THYAO/ }),
    ).toBeVisible();
  });
});
