"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectOption<Value extends string = string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};

type SelectProps<Value extends string = string> = {
  options: readonly SelectOption<Value>[];
  value?: Value | null;
  defaultValue?: Value | null;
  onValueChange?: (value: Value | null) => void;
  placeholder?: string;
  /** Görünür etiket; `Select.Label` tetikleyiciye `aria-labelledby` bağlar. */
  label?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  /** `FormField` ile kullanılacaksa kontrol `id`'si (etiket bağlantısı). */
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  triggerClassName?: string;
  popupClassName?: string;
};

/**
 * Açılır seçim (Base UI Select, K-01).
 *
 * Klavye gezintisi Base UI'dan gelir: trigger `role="combobox"`,
 * `aria-expanded`/`aria-haspopup`/`aria-controls` otomatik yazılır; listede
 * ok tuşları + typeahead + Enter/Space çalışır. Görünür etiket için `label`,
 * etiketsiz kullanımda `aria-label` verilmelidir.
 */
export function Select<Value extends string = string>({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  label,
  disabled,
  required,
  name,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  triggerClassName,
  popupClassName,
}: SelectProps<Value>) {
  return (
    <BaseSelect.Root<Value>
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => onValueChange?.(nextValue)}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
    >
      {label ? (
        <BaseSelect.Label className="text-sm font-medium text-foreground select-none">
          {label}
        </BaseSelect.Label>
      ) : null}
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid || undefined}
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-surface pr-2 pl-3 text-sm text-surface-foreground transition-colors duration-150 ease-out select-none hover:bg-surface-hover data-disabled:pointer-events-none data-disabled:opacity-50 aria-invalid:border-negative md:h-9",
          triggerClassName,
        )}
      >
        <BaseSelect.Value
          placeholder={placeholder}
          className="truncate data-placeholder:text-muted-foreground"
        >
          {(selected: Value | null) =>
            selected === null
              ? (placeholder ?? null)
              : (options.find((option) => option.value === selected)?.label ?? selected)
          }
        </BaseSelect.Value>
        <BaseSelect.Icon className="shrink-0 text-muted-foreground">
          <ChevronsUpDown aria-hidden="true" className="size-4" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          sideOffset={4}
          alignItemWithTrigger={false}
          className="z-50"
        >
          <BaseSelect.Popup
            className={cn(
              "max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto rounded-lg border border-border bg-surface-raised p-1 shadow-pop transition-[opacity,transform] duration-150 ease-out data-starting-style:scale-98 data-starting-style:opacity-0 data-ending-style:scale-98 data-ending-style:opacity-0",
              popupClassName,
            )}
          >
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-surface-hover"
                >
                  <BaseSelect.ItemIndicator className="col-start-1 flex items-center justify-center text-primary">
                    <Check aria-hidden="true" className="size-3.5" />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="col-start-2 truncate">
                    {option.label}
                  </BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
