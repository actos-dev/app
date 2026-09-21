"use client";

/**
 * Hata durumu (plan §3.4, §3.1 ilke 6).
 *
 * `retry` nesnesiyle "tekrar dene" butonu, `action` ile serbest eylem slotu
 * sunulur. Metinler i18n'den çağıran tarafından verilir.
 */
import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title: ReactNode;
  description?: ReactNode;
  retry?: { label: ReactNode; onRetry: () => void };
  action?: ReactNode;
  className?: string;
};

export function ErrorState({ title, description, retry, action, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-surface-raised text-negative">
        <TriangleAlert aria-hidden="true" className="size-5" />
      </span>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      {retry || action ? (
        <div className="mt-3 flex items-center gap-2">
          {retry ? (
            <Button variant="secondary" onClick={retry.onRetry}>
              {retry.label}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
