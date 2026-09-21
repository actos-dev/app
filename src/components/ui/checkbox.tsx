"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxProps = Omit<BaseCheckbox.Root.Props, "className"> & {
  className?: string;
};

/**
 * Onay kutusu (Base UI).
 *
 * Varsayılan olarak `<span>` + gizli `<input>` render eder; bu yüzden
 * `<label><Checkbox /> Metin</label>` deseni ile etiketlenir (A-01).
 * Onay kutusu, 44px dokunma hedefi kuralının bilinçli istisnasıdır (A-05);
 * hedefi büyütmek için `size-` sınıfını geçmek yeterlidir.
 */
export function Checkbox({ className, indeterminate, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-primary-foreground transition-colors duration-150 ease-out data-checked:border-primary data-checked:bg-primary data-disabled:opacity-50",
        className,
      )}
      indeterminate={indeterminate}
      {...props}
    >
      <BaseCheckbox.Indicator className="flex items-center justify-center">
        {indeterminate ? (
          <Minus aria-hidden="true" className="size-3" />
        ) : (
          <Check aria-hidden="true" className="size-3" />
        )}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
