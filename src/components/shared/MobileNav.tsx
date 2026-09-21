"use client";

/**
 * Mobil navigasyon paneli (plan §4, D-09).
 *
 * Topbar'daki menü düğmesi soldan açılan bir Base UI Dialog açar; odak tuzağı,
 * Escape ile kapatma ve kapanışta odağın düğmeye dönmesi Base UI'dan gelir.
 * Masaüstünde düğme gizlenir (`md:hidden`), sidebar zaten görünürdür.
 */
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { NavLinks } from "./Sidebar";

export function MobileNav({ authenticated = true }: { authenticated?: boolean }) {
  const t = useTranslations("common");
  const tApp = useTranslations("app");
  const [open, setOpen] = useState(false);

  return (
    <BaseDialog.Root open={open} onOpenChange={setOpen}>
      <BaseDialog.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("openMenu")}
            className="md:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
          </Button>
        }
      />
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-overlay transition-opacity duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <BaseDialog.Popup className="fixed inset-y-0 left-0 z-50 flex h-dvh w-72 flex-col gap-4 border-r border-border bg-surface p-4 shadow-pop transition-transform duration-150 ease-out data-starting-style:-translate-x-full data-ending-style:-translate-x-full">
          <div className="flex h-8 items-center justify-between gap-2">
            <BaseDialog.Title className="px-2.5 text-sm font-semibold text-foreground">
              {tApp("name")}
            </BaseDialog.Title>
            <BaseDialog.Close
              render={
                <Button variant="ghost" size="icon" aria-label={t("closeMenu")}>
                  <X aria-hidden="true" className="size-5" />
                </Button>
              }
            />
          </div>
          <NavLinks authenticated={authenticated} onNavigate={() => setOpen(false)} />
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
