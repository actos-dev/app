/**
 * `(auth)` route grubu layout'u (plan Faz 2).
 *
 * Kabuksuz (AppShell YOK): ortalanmış, sade bir çerçeve. Tema `<html>`
 * üzerindeki `data-theme`'den gelir; burada yalnız token tabanlı yüzey
 * kullanılır. Üstte marka bağlantısı ve dil değiştirici durur.
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("app");

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="rounded-md text-sm font-semibold tracking-tight text-foreground transition-colors duration-150 ease-out hover:text-primary"
        >
          {t("name")}
        </Link>
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>
    </div>
  );
}
