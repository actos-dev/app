"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DialogProps = {
  /**
   * Diyaloğu açan öğe; Base UI `render` ile tetikleyiciye dönüşür (ör. `<Button>`).
   * Kontrollü (`open`/`onOpenChange`) kullanımda opsiyoneldir.
   */
  trigger?: ReactElement;
  /** Zorunlu başlık; `Dialog.Title` olarak render edilir ve diyaloğu adlandırır. */
  title: ReactNode;
  /** Zorunlu açıklama; `Dialog.Description` olarak render edilir. */
  description: ReactNode;
  children?: ReactNode;
  /** Alt eylem satırı (iptal/onay gibi). */
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/**
 * Diyalog (Base UI Dialog).
 *
 * Escape ile kapatma, odak tuzağı ve kapanışta odağın tetikleyiciye dönmesi
 * Base UI'dan gelir. API `title` ve `description` alanlarını zorunlu tutar
 * (erişilebilir ad + açıklama her diyalogda garanti).
 *
 * Kapat butonunun görünmez metni şimdilik nötr İngilizce "Close"tur; i18n
 * anahtarı (`common.close`) Faz 2'de eklendiğinde buradan çevrilecek (A-06).
 */
export function Dialog({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  className,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-overlay transition-opacity duration-150 ease-out supports-[-webkit-touch-callout:none]:absolute data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <BaseDialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 shadow-pop transition-[opacity,transform] duration-150 ease-out data-starting-style:scale-98 data-starting-style:opacity-0 data-ending-style:scale-98 data-ending-style:opacity-0",
            className,
          )}
        >
          <div className="flex flex-col gap-1 pr-8">
            <BaseDialog.Title className="text-base font-semibold text-foreground">
              {title}
            </BaseDialog.Title>
            <BaseDialog.Description className="text-sm text-muted-foreground">
              {description}
            </BaseDialog.Description>
          </div>
          {children}
          {footer ? <div className="flex justify-end gap-2">{footer}</div> : null}
          <BaseDialog.Close className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-foreground">
            <X aria-hidden="true" className="size-4" />
            <span className="sr-only">Close</span>
          </BaseDialog.Close>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/** Diyalog gövdesinden kapatma; `footer` içinde `render={<Button />}` ile kullanılır. */
export const DialogClose = BaseDialog.Close;
