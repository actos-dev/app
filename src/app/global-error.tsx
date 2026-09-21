"use client";

/**
 * Kök hata sınırı (plan K-06).
 *
 * `global-error.tsx` yalnız kök layout çöktüğünde devreye girer ve kendi
 * `<html>`/`<body>` ağacını üretmek zorundadır; bu yüzden kök layout'un
 * `NextIntlClientProvider`'ı burada yoktur — varsayılan dil (`tr`) kataloğu
 * statik olarak sarılır. Tema token'ları için globals.css yeniden içe alınır.
 */
import { TriangleAlert } from "lucide-react";
import { NextIntlClientProvider, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import messages from "../../messages/tr.json";
import "./globals.css";

function GlobalErrorContent({
  digest,
  reset,
}: {
  digest?: string;
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-negative">
        <TriangleAlert aria-hidden="true" className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold">{t("genericTitle")}</h1>
      <p className="max-w-prose text-sm text-muted-foreground">{t("genericDescription")}</p>
      {digest ? (
        <p className="font-mono text-xs text-muted-foreground">
          {t("errorId")}: {digest}
        </p>
      ) : null}
      <Button variant="primary" className="mt-2" onClick={reset}>
        {t("retry")}
      </Button>
    </main>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr" data-theme="dark">
      <body>
        <NextIntlClientProvider locale="tr" messages={messages}>
          <GlobalErrorContent digest={error.digest} reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
