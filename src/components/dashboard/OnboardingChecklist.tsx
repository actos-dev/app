"use client";

/**
 * Başlangıç kontrol listesi (Faz 5 / Birim 5B.4, U-13, P-05).
 *
 * Üç adım: e-postayı doğrula, ilk hisseyi takibe al, ilk portföyü oluştur.
 * Veri dashboard RSC paketinden gelir (profil, favori sayısı, portföy sayısı);
 * bu bileşen EK İSTEK AÇMAZ. Doğrulama durumu profil alanından okunur; profil
 * yüklenemediyse o adım hiç gösterilmez.
 *
 * Tüm adımlar tamamlandığında veya kullanıcı kapattığında kart görünmez.
 * Kapatma tercihi `localStorage`da tutulur; bu YALNIZCA bir arayüz tercihidir,
 * kimlik doğrulama token'ı veya kişisel veri burada SAKLANMAZ.
 */
import { CheckCircle2, Circle, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState, useSyncExternalStore } from "react";

import { Panel } from "@/components/shared/Panel";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Profile } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

/**
 * Kapatma tercihi anahtarı. Değer `"1"` ise kart gizlenir. Token saklama
 * yasağı gereği burada yalnızca sabit bir UI bayrağı tutulur.
 */
export const ONBOARDING_DISMISSED_KEY = "florence.onboarding.dismissed";

/** Yalnızca çapraz sekme senkronu; aynı sekmedeki yazım `dismiss` ile yansır. */
function subscribeOnboardingPreference(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

/** Kapatma bayrağı; localStorage okunamazsa kapalı sayılır. */
function getDismissedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Sunucuda localStorage yok; SSR her zaman "kapatılmamış" kabul eder. */
function getServerDismissedSnapshot(): boolean {
  return false;
}

type OnboardingStepId = "verifyEmail" | "follow" | "portfolio";

type OnboardingStep = {
  id: OnboardingStepId;
  href: Route;
  done: boolean;
};

type OnboardingChecklistProps = {
  /** Dashboard paketinden gelen profil; yoksa doğrulama adımı gösterilmez. */
  profile: Profile | null;
  /** Favori ticker sayısı. */
  favoritesCount: number;
  /** Portföy sayısı. */
  portfoliosCount: number;
  className?: string;
};

export function OnboardingChecklist({
  profile,
  favoritesCount,
  portfoliosCount,
  className,
}: OnboardingChecklistProps) {
  const t = useTranslations("onboarding");

  // Kalıcı tercih harici depodan okunur (SSR'da kapalı); aynı sekmedeki kapatma
  // anında yansıması için yerel bir bayrak eklenir.
  const persistedDismissed = useSyncExternalStore(
    subscribeOnboardingPreference,
    getDismissedSnapshot,
    getServerDismissedSnapshot,
  );
  const [dismissedNow, setDismissedNow] = useState(false);
  const dismissed = persistedDismissed || dismissedNow;

  const steps = useMemo<OnboardingStep[]>(() => {
    const list: OnboardingStep[] = [];
    if (profile) {
      list.push({ id: "verifyEmail", href: "/profile", done: profile.email_verified });
    }
    list.push({ id: "follow", href: "/markets", done: favoritesCount > 0 });
    list.push({ id: "portfolio", href: "/portfolio", done: portfoliosCount > 0 });
    return list;
  }, [profile, favoritesCount, portfoliosCount]);

  if (dismissed || steps.every((step) => step.done)) {
    return null;
  }

  const doneCount = steps.filter((step) => step.done).length;

  function dismiss() {
    setDismissedNow(true);
    try {
      window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
    } catch {
      // Kalıcı yazma başarısız olsa da kart bu oturumda gizlenir.
    }
  }

  return (
    <Panel
      title={t("title")}
      className={className}
      actions={
        <Button variant="ghost" size="icon" aria-label={t("dismiss")} onClick={dismiss}>
          <X aria-hidden="true" className="size-4" />
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <ul className="flex flex-col divide-y divide-border">
          {steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href}
                className="flex min-h-11 items-center gap-3 rounded-md px-1 text-sm text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover md:min-h-9"
              >
                {step.done ? (
                  <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-positive" />
                ) : (
                  <Circle aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "font-medium",
                      step.done && "text-muted-foreground line-through",
                    )}
                  >
                    {t(`steps.${step.id}.title`)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {step.done ? t(`steps.${step.id}.done`) : t(`steps.${step.id}.description`)}
                  </span>
                </span>
                {!step.done ? (
                  <span className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    {t(`steps.${step.id}.cta`)}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          {t("progress", { done: doneCount, total: steps.length })}
        </p>
      </div>
    </Panel>
  );
}
