"use client";

/**
 * Bakım modu uyarısı (Faz 5 / Birim 5A.2).
 *
 * `require_feature` bir özelliği kapattığında backend `503` döner; bu bileşen
 * durumu net gösterir. Eski uygulamadaki "sessiz başarısızlık" hatası
 * tekrarlanmasın diye hem görünür bir uyarı hem de form kilidi eşlik eder.
 */
import { Wrench } from "lucide-react";

import { cn } from "@/lib/utils";

type MaintenanceNoticeProps = {
  title: string;
  description: string;
  className?: string;
};

export function MaintenanceNotice({ title, description, className }: MaintenanceNoticeProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-md border border-border bg-surface-raised px-3 py-2",
        className,
      )}
    >
      <Wrench aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
