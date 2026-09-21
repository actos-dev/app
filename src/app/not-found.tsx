/**
 * Gerçek 404 (plan K-06, §4 "not-found").
 *
 * Kök seviyede; `(app)` kabuğunu gerektirmez. `Link href="/"` typedRoutes ile
 * doğrulanır. Metinler `errors` namespace'inden gelir (S-18).
 */
import { Compass } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errors");
  return { title: t("notFoundTitle") };
}

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
        <Compass aria-hidden="true" className="size-6" />
      </span>
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="max-w-prose text-sm text-muted-foreground">{t("notFoundDescription")}</p>
      <Link href="/" className={cn("mt-2", buttonVariants({ variant: "primary" }))}>
        {t("goHome")}
      </Link>
    </main>
  );
}
