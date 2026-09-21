/**
 * `/login` yer tutucusu (Faz 2 / Birim 2.1).
 *
 * Gerçek giriş formu Birim 2.2'de gelecek. Bu sayfa yalnızca Proxy ve
 * korumalı layout'un `/login?next=...` yönlendirmelerinin 404'e düşmemesi
 * için vardır; form, şifre işleme ve token saklama yoktur.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background p-6 text-center text-foreground">
      <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
      <p className="max-w-prose text-sm text-muted-foreground">{t("loginPlaceholder")}</p>
    </main>
  );
}
