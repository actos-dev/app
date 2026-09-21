import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Çok satırlı metin girişi. `Input` ile aynı token dilini kullanır;
 * yalnızca yükseklik sabit değil, `min-h` iledir.
 */
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-sm text-surface-foreground transition-colors duration-150 ease-out placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-negative",
        className,
      )}
      {...props}
    />
  );
}
