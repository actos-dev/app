/**
 * Boş durum (plan §3.4, §3.1 ilke 6).
 *
 * Metinler i18n'den çağıran tarafından verilir; ikon opsiyoneldir ve
 * dekoratiftir (`aria-hidden` çağıranda). Aksiyon bir `Link` veya `Button`
 * olabilir.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-surface-raised text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
