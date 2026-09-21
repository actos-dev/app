"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Label } from "./label";

/**
 * Kontrolün `FormField` tarafından üretilen bağlantı nitelikleri.
 * `id` → `htmlFor`/`id` eşleşmesi; `aria-describedby` → hint + hata;
 * `aria-invalid` → yalnızca hata varken `true` (A-01, A-03).
 */
export type FormFieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FormFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  /** Kontrolü (Input/Textarea/Select...) bağlantı nitelikleriyle render eder. */
  children: (controlProps: FormFieldControlProps) => ReactNode;
};

/**
 * Etiket + kontrol + hint/hata deseni (K-01, A-01).
 *
 * Render-prop API bilinçli bir tercihtir: `cloneElement` yerine kontrol
 * nitelikleri açıkça verilir; böylece hangi kontrolün bağlandığı bellidir
 * ve `getByLabelText` her zaman çalışır.
 */
export function FormField({
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null]
      .filter((value): value is string => value !== null)
      .join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-negative">
            *
          </span>
        ) : null}
      </Label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-negative">
          {error}
        </p>
      ) : null}
    </div>
  );
}
