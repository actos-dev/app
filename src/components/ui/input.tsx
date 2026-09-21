import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Metin girişi.
 *
 * Dokunma hedefi mobilde ≥ 44px, masaüstünde yoğun (D-09); global
 * `input { min-height }` hack'i bilinçli olarak yoktur. Geçersiz durum
 * `aria-invalid` ile işaretlenir ve yalnızca kenarlıkla gösterilir.
 */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-sm text-surface-foreground transition-colors duration-150 ease-out placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-negative md:h-9",
        className,
      )}
      {...props}
    />
  );
}
