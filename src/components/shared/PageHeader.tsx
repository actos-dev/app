/**
 * Sayfa başlığı (plan §3.4, D-05, A-04).
 *
 * Her sayfada tek `<h1>`; açıklama ve eylemler başlıkla aynı blokta durur.
 * Geri bağlantısı verildiğinde etiketi zorunludur (i18n anahtarı çağırandan
 * gelir; bu bileşen metin üretmez).
 */
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
} & (
  | { backHref?: undefined; backLabel?: undefined }
  | { backHref: Route; backLabel: ReactNode }
);

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3 pb-6", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
