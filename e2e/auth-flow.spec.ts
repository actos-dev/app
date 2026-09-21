/**
 * Kayıt → doğrulama, giriş ve çıkış akışları (Faz 6 / Birim 6.1a, plan U-01/U-11).
 */
import { expect, test } from "@playwright/test";

import { resetStub, signIn } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetStub(request);
});

test.describe("Auth akışı", () => {
  test("kayıt sonrası e-posta doğrulama ekranına gider", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Kullanıcı adı").fill("yenikullanici");
    await page.getByLabel("E-posta", { exact: true }).fill("yeni@florence.test");
    await page.getByLabel("Şifre", { exact: true }).fill("parola12345");
    await page.getByLabel("Şifre (tekrar)").fill("parola12345");
    await page.getByRole("button", { name: "Kayıt ol" }).click();

    await page.waitForURL(/\/verify-email/);
    await expect(
      page.getByRole("heading", { name: "E-postanı doğrula" }),
    ).toBeVisible();
  });

  test("giriş kişisel paneli açar, çıkış login'e döner", async ({ page }) => {
    await signIn(page);

    await expect(page.getByRole("heading", { name: "Genel Bakış" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Portföy özeti" })).toBeVisible();

    await page.getByRole("button", { name: "Hesap menüsü" }).click();
    await page.getByRole("menuitem", { name: "Çıkış yap" }).click();

    await page.waitForURL(/\/login(\?|$)/);
    await expect(page.getByRole("heading", { name: "Giriş yap" })).toBeVisible();
  });
});
