import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Yüklenme iskeleti. `animate-pulse` global `prefers-reduced-motion` kuralına
 * uyar; ekran okuyucudan gizlidir, çağıran taraf `role="status"` metni verir.
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-raised", className)}
      {...props}
    />
  );
}
