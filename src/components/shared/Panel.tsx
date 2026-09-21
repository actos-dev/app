/**
 * Yüzey konteyneri (plan §3.4, D-05).
 *
 * Kart yerine tek desen: başlık + eylemler + içerik aynı border'lı yüzeyde.
 * Başlık `<h2>` olarak render edilir; sayfa h1'i `PageHeader`'dan gelir (A-04).
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PanelProps = {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Panel({ title, actions, children, className, contentClassName }: PanelProps) {
  return (
    <section className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      {title || actions ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          {title ? <h2 className="text-sm font-semibold text-foreground">{title}</h2> : <span />}
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </section>
  );
}
