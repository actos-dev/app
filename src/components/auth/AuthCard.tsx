/**
 * Auth sayfası kartı (plan Faz 2, A-01/A-04).
 *
 * Başlık + açıklama + içerik + alt bağlantılar desenini tek yerde tutar;
 * login/register/verify ekranları aynı çerçeveyi paylaşır. Metinler çağırandan
 * gelir (bu bileşen i18n anahtarı üretmez).
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <section
      className={cn(
        "flex w-full max-w-sm flex-col gap-6 rounded-lg border border-border bg-surface p-6 text-foreground",
        className,
      )}
    >
      <header className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {children}
      {footer ? (
        <footer className="border-t border-border pt-4 text-sm text-muted-foreground">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
