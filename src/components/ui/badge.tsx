import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Durum rozeti. Dolgu + `*-foreground` çifti kullanılır; kontrast eşikleri
 * token testinden gelir (`positive-foreground` / `positive` vb.).
 */
export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border border-border bg-surface-raised text-foreground",
        positive: "bg-positive text-positive-foreground",
        negative: "bg-negative text-negative-foreground",
        warning: "bg-warning text-warning-foreground",
        info: "bg-info text-info-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
