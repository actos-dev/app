"use client";

/**
 * Analiz sekmelerinin ortak küçük parçaları (Faz 4 / Birim 4.3, K-03).
 *
 * Etiket + değer hücresi, hata ve boş durum sarmalayıcıları tek yerde tutulur;
 * her sekme aynı deseni kopyalamaz.
 */
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

/** Sayısal alan hücresi; `dl` grubu içinde kullanılır. */
export function AnalyticsStat({
  label,
  hint,
  children,
}: {
  label: string;
  /** Alanın ne anlama geldiğini açıklayan tek satır (i18n). */
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-surface p-3">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium text-foreground">{children}</dd>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** İstatistik hücrelerini saran ızgara. */
export function AnalyticsStatGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</dl>;
}

/** Analiz sorgusu başarısız olduğunda gösterilen ortak hata. */
export function AnalyticsError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("portfolio.analytics");
  return (
    <ErrorState title={t("error")} retry={{ label: t("retry"), onRetry }} />
  );
}

/** Analiz sekmesi için ortak boş durum. */
export function AnalyticsEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <EmptyState title={title} {...(description ? { description } : {})} />
  );
}
