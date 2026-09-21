import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Buton (plan §3.4).
 *
 * Native `<button>` + `cva`; Base UI'ya gerek yoktur ve `asChild` deseni
 * bilinçli olarak yoktur. Dokunma hedefi mobilde ≥ 44px, masaüstünde yoğun
 * (D-09); gövde ölçüsü `md:` kırılımında düşer.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "border border-border bg-surface text-surface-foreground hover:bg-surface-hover",
        ghost: "text-foreground hover:bg-surface-hover",
        danger:
          "bg-negative text-negative-foreground hover:brightness-110 active:brightness-95",
      },
      size: {
        sm: "h-11 px-3 md:h-8",
        md: "h-11 px-4 md:h-9",
        lg: "h-12 px-5 text-base md:h-10",
        icon: "size-11 md:size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Yükleniyor durumu: spinner gösterilir, `aria-busy` yazılır ve tıklama engellenir. */
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
