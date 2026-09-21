/**
 * E2E yardımcıları ve paylaşılan sabitler (Faz 6 / Birim 6.1a).
 *
 * Stub backend ile testler arasındaki sözleşme (kullanıcı/şifre, kontrol
 * uçları) burada tek yerde tutulur; stub tarafındaki karşılıkları
 * `e2e/stub-backend.mjs` başındaki sabitlerdir.
 */
import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const STUB_URL = "http://127.0.0.1:7055";

/** Stub'ın kabul ettiği demo hesabı. */
export const DEMO_USERNAME = "demo";
export const DEMO_PASSWORD = "demo123456";

/** Stub durumunu varsayılana döndürür (her testten önce). */
export async function resetStub(request: APIRequestContext): Promise<void> {
  await request.post(`${STUB_URL}/__control/reset`);
}

/** Piyasayı test amaçlı aç/kapat. */
export async function setMarketOpen(request: APIRequestContext, open: boolean): Promise<void> {
  await request.post(`${STUB_URL}/__control/market`, { data: { open } });
}

/** Stub'da doğrudan (UI akışını atlayarak) portföy kurar; id döner. */
export async function seedPortfolio(
  request: APIRequestContext,
  name: string,
  balance = 100000,
): Promise<string> {
  const response = await request.post(`${STUB_URL}/__control/portfolio`, {
    data: { name, balance },
  });
  const body = (await response.json()) as { id: string };
  return body.id;
}

/** Demo kullanıcısıyla formdan giriş yapar ve `/dashboard`'a ulaşmayı bekler. */
export async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  const username = page.getByLabel("Kullanıcı adı");
  await expect(username).toBeVisible();
  await username.fill(DEMO_USERNAME);
  await page.getByLabel("Şifre", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await page.waitForURL("**/dashboard");
}

/** Al/sat diyaloğunda sembol arar ve sonucu seçer (al/sat formu için). */
export async function selectTradeSymbol(page: Page, ticker: string): Promise<void> {
  const dialog = page.getByRole("dialog");
  const combobox = dialog.getByRole("combobox");
  await combobox.click();
  await combobox.fill(ticker);
  // Sonuç popup'ı Portal ile body'ye taşınır; bu yüzden page düzeyinde aranır.
  const option = page.getByRole("option", { name: new RegExp(ticker, "i") });
  await expect(option).toBeVisible();
  await option.click();
}
