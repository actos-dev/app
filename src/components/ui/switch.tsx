"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

type SwitchProps = Omit<BaseSwitch.Root.Props, "className"> & {
  className?: string;
};

/**
 * Anahtar (Base UI). Etiketle kullanılır:
 * `<label><Switch /> Bildirimler</label>`.
 *
 * Ray mobilde 44px genişliğindedir (D-09); yükseklik görsel olarak 24px
 * kaldığı için dokunma hedefi etiketle birlikte büyür.
 */
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border bg-surface-raised p-0.5 transition-colors duration-150 ease-out data-checked:border-primary data-checked:bg-primary data-disabled:opacity-50 md:h-5 md:w-9",
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb className="block size-5 rounded-full bg-foreground transition-transform duration-150 ease-out data-checked:translate-x-5 data-checked:bg-primary-foreground md:size-4 md:data-checked:translate-x-4" />
    </BaseSwitch.Root>
  );
}
