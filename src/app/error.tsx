"use client";

/**
 * Route hata sınırı (plan K-06, S-08 iskeleti).
 *
 * Client bileşen olmak zorundadır (Next sözleşmesi). `error.digest` sunucu
 * loglarıyla eşleşen kimliktir ve kullanıcıya gösterilir; gerçek panele
 * raporlama S-08'de eklenecek.
 */
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
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
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">
          {t("errorId")}: {error.digest}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" onClick={reset}>
          {t("retry")}
        </Button>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          {t("goHome")}
        </Link>
      </div>
    </main>
  );
}
