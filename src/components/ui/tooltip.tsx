"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { useId, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type TooltipProps = {
  content: ReactNode;
  /**
   * Tetikleyici öğe (ör. `<Button />`). Görünür metni yoksa `aria-label`
   * taşımalıdır; tooltip erişilebilir ad yerine geçmez.
   */
  children: ReactElement;
  /** Açılma gecikmesi (ms). Varsayılan Base UI 600 yerine 400. */
  delay?: number;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
};

/**
 * İpucu (Base UI Tooltip).
 *
 * Base UI dokümanına göre dokunmatik cihazlarda tooltip devre dışıdır
 * (hover olmadan keşfedilemez); kritik bilgi tooltip'e gömülmez, `Popover`
 * veya satır içi metin tercih edilir. Bu yüzden burada ayrıca dokunma
 * davranışı yazılmaz.
 *
 * Not: Base UI 1.8 `Tooltip.Popup`'a `role="tooltip"` ve tetikleyiciye
 * `aria-describedby` yazmaz; erişilebilirlik bağlantısı burada kurulur.
 */
export function Tooltip({
  content,
  children,
  delay = 400,
  side = "top",
  sideOffset = 6,
  className,
}: TooltipProps) {
  const popupId = useId();

  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} delay={delay} aria-describedby={popupId} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={sideOffset} className="z-50">
          <BaseTooltip.Popup
            id={popupId}
            role="tooltip"
            className={cn(
              "max-w-xs rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-foreground shadow-pop",
              className,
            )}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/** Aynı anda birden çok tooltip için ortak gecikme grubu (opsiyonel sarmalayıcı). */
export const TooltipProvider = BaseTooltip.Provider;
