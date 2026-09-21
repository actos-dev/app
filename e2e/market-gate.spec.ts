/**
 * Seans kapısı: piyasa kapalıyken al/sat gönderimi baştan engellenir (Faz 6 /
 * Birim 6.1a, plan U-04; backend B-07 `error_market_closed`).
 *
 * Stub'da piyasa kapatılır; portföy detayındaki Al/Sat diyaloğu gerekçeyi
 * gösterir ve gönderim düğmesi devre dışı kalır.
 */
import { expect, test } from "@playwright/test";

import { resetStub, seedPortfolio, selectTradeSymbol, setMarketOpen, signIn } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetStub(request);
});

test.describe("Seans kapısı", () => {
  test("piyasa kapalıyken al/sat engellenir ve gerekçe görünür", async ({
    page,
    request,
  }) => {
    await signIn(page);
    const portfolioId = await seedPortfolio(request, "Kapanış Testi");
    await setMarketOpen(request, false);

    await page.goto(`/portfolio/${portfolioId}`);
    await page.getByRole("button", { name: "Al / Sat" }).click();

    const tradeDialog = page.getByRole("dialog");
    await expect(tradeDialog).toBeVisible();

    await selectTradeSymbol(page, "THYAO");
    await tradeDialog.getByLabel("Adet").fill("5");

    await expect(tradeDialog.getByText(/Piyasa kapalı/)).toBeVisible();
    await expect(
      tradeDialog.getByRole("button", { name: "Alış emrini gönder" }),
    ).toBeDisabled();
  });
});
