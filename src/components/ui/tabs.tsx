"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

type TabsProps = {
  items: readonly TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  /**
   * `true` iken pasif paneller DOM'da kalır (`data-hidden`, gizli); panel
   * içi state (form, tablo sayfası, grafik) korunur. Portföy sekmeleri gibi
   * sekmeler arası geçişte durum kaybı istenmeyen yerlerde kullanılır.
   * `false` (varsayılan) iken pasif paneller unmount edilir.
   */
  keepMounted?: boolean;
  className?: string;
  listClassName?: string;
  panelClassName?: string;
};

/**
 * Sekme grubu (Base UI Tabs, K-01).
 *
 * Ok tuşlarıyla gezinme Base UI'dan gelir; `activateOnFocus` sayesinde ok
 * tuşu hem odağı taşır hem sekmeyi aktive eder (tek elle klavye erişimi).
 * `Tabs` tek desendir; elle buton satırı yazılmaz.
 */
export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  keepMounted = false,
  className,
  listClassName,
  panelClassName,
}: TabsProps) {
  return (
    <BaseTabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={(nextValue: string) => onValueChange?.(nextValue)}
      className={className}
    >
      <BaseTabs.List
        activateOnFocus
        className={cn("relative flex items-center gap-1 border-b border-border", listClassName)}
      >
        {items.map((item) => (
          <BaseTabs.Tab
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className="relative inline-flex h-11 items-center justify-center rounded-t-md px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-150 ease-out select-none hover:text-foreground data-active:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 md:h-8"
          >
            {item.label}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className="absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) bg-primary transition-[translate,width] duration-150 ease-out" />
      </BaseTabs.List>
      {items.map((item) => (
        <BaseTabs.Panel
          key={item.value}
          value={item.value}
          keepMounted={keepMounted}
          className={cn("pt-4", panelClassName)}
        >
          {item.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
