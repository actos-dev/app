/**
 * Çevrimdışı sayfası (Faz 6 / Birim 6.4, plan M-12, S-11).
 *
 * Service worker gezinme isteğinde ağa ulaşamazsa bu sayfayı önbellekten
 * servis eder (`public/sw.js` `install` sırasında ön belleğe alınır). Public'tir
 * ve proxy korumasına takılmaz (`/offline` korunan öneklerde değildir).
 */
import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { OfflineRetryButton } from "@/components/shared/OfflineRetryButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline");
  return { title: t("title") };
}

export default async function OfflinePage() {
  const t = await getTranslations("offline");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
        <WifiOff aria-hidden="true" className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="max-w-prose text-sm text-muted-foreground">{t("description")}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <OfflineRetryButton />
        <Link href="/" className={cn(buttonVariants({ variant: "secondary" }))}>
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
