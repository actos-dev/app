import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Form etiketi. `FormField` `htmlFor` bağlantısını `useId` ile kurar;
 * tek başına kullanıldığında `htmlFor` çağıranın sorumluluğundadır (A-01).
 */
export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground select-none", className)}
      {...props}
    />
  );
}
