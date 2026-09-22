"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Fragment, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type MenuItem = {
  /** Görünen içerik; düz metin önerilir (klavye typeahead'i için). */
  label: ReactNode;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  /** Yıkıcı eylem: `text-negative` ile işaretlenir (ör. çıkış). */
  destructive?: boolean;
  /** Öğeden önce ayırıcı çizer. */
  separatorBefore?: boolean;
  /** Bağlantıya ipucu metni ekler (ör. anonimde giriş gerekli). */
  title?: string;
  /** Bağlantıyı kilitli işaretler (`aria-disabled`) ve soluklaştırır. */
  "aria-disabled"?: boolean;
  /** Aktif sayfayı vurgular (`aria-current="page"`). */
  active?: boolean;
};

type MenuProps = {
  /** Menüyü açan öğe; Base UI `render` ile tetikleyiciye dönüşür (ör. `<Button />`). */
  trigger: ReactElement;
  items: readonly MenuItem[];
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
  triggerClassName?: string;
  /** Tetikleyicide görünür metin yoksa zorunludur. */
  "aria-label"?: string;
};

/**
 * Açılır menü (Base UI Menu, K-01) — kullanıcı/topbar menüsü için.
 *
 * Klavye gezintisi (ok tuşları, Home/End, typeahead, Escape) ve `role="menu"`
 * ARIA'sı Base UI'dan gelir. Öğe listesi statik kabul edilir; bu yüzden
 * anahtar olarak sıra numarası kullanılır.
 */
export function Menu({
  trigger,
  items,
  align = "end",
  sideOffset = 4,
  className,
  triggerClassName,
  "aria-label": ariaLabel,
}: MenuProps) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        render={trigger}
        aria-label={ariaLabel}
        className={triggerClassName}
      />
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={sideOffset} align={align} className="z-50">
          <BaseMenu.Popup
            className={cn(
              "min-w-40 rounded-lg border border-border bg-surface-raised p-1 shadow-pop transition-[opacity,transform] duration-150 ease-out data-starting-style:scale-98 data-starting-style:opacity-0 data-ending-style:scale-98 data-ending-style:opacity-0",
              className,
            )}
          >
            {items.map((item, index) => (
              <Fragment key={index}>
                {item.separatorBefore ? (
                  <BaseMenu.Separator className="my-1 h-px bg-border" />
                ) : null}
                {item.href ? (
                  <BaseMenu.LinkItem
                    href={item.href}
                    title={item.title}
                    aria-disabled={item["aria-disabled"]}
                    aria-current={item.active ? "page" : undefined}
                    className={menuItemClassName(item)}
                  >
                    {item.label}
                  </BaseMenu.LinkItem>
                ) : (
                  <BaseMenu.Item
                    disabled={item.disabled}
                    onClick={item.onSelect}
                    className={menuItemClassName(item)}
                  >
                    {item.label}
                  </BaseMenu.Item>
                )}
              </Fragment>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

function menuItemClassName({
  destructive,
  disabled,
  active,
  "aria-disabled": ariaDisabled,
}: MenuItem): string {
  return cn(
    "flex min-h-11 cursor-default items-center gap-2 rounded-md px-2 text-sm select-none data-highlighted:bg-surface-hover data-disabled:pointer-events-none data-disabled:opacity-50 md:min-h-8",
    destructive ? "text-negative" : "text-foreground",
    active && "bg-surface-hover font-medium",
    disabled && "opacity-50",
    ariaDisabled && "opacity-60",
  );
}
