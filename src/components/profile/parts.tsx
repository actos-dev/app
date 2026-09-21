"use client";

/**
 * Profil sekmelerinin ortak küçük parçaları (Faz 5 / Birim 5B.2, A-03).
 *
 * `StatusMessage`, başarıyı `role="status"` ile duyurur ve hataları
 * `role="alert"` ile ayırır (A-03). Form seviyesi geri bildirim tek desenden
 * gelsin diye burada toplanır.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusMessageProps = {
  kind: "success" | "error";
  children: ReactNode;
  className?: string;
};

export function StatusMessage({ kind, children, className }: StatusMessageProps) {
  if (kind === "error") {
    return (
      <p
        role="alert"
        className={cn(
          "rounded-md border border-negative bg-surface px-3 py-2 text-sm text-negative",
          className,
        )}
      >
        {children}
      </p>
    );
  }
  return (
    <p
      role="status"
      className={cn(
        "rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
