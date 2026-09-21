"use client";

import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";

import type { ThemeName } from "@/i18n/config";

type ToastStyleVars = CSSProperties & Record<`--${string}`, string>;

/**
 * Sonner'ı token'lara bağlar. Kütüphane varsayılan renkleri yerine
 * `--normal-*` değişkenleri kullanılır; böylece bildirimler tema ile
 * birlikte değişir. Kütüphane CSS'i katmansız enjekte edildiği için
 * Tailwind sınıfları yerine inline CSS değişkenleri tercih edilir.
 */
const toasterStyle: ToastStyleVars = {
  fontFamily: "var(--font-sans)",
  "--border-radius": "var(--radius)",
  "--normal-bg": "var(--surface-raised)",
  "--normal-bg-hover": "var(--surface-hover)",
  "--normal-border": "var(--border)",
  "--normal-border-hover": "var(--border-strong)",
  "--normal-text": "var(--foreground)",
  "--success-bg": "var(--positive)",
  "--success-border": "var(--positive)",
  "--success-text": "var(--positive-foreground)",
  "--error-bg": "var(--negative)",
  "--error-border": "var(--negative)",
  "--error-text": "var(--negative-foreground)",
  "--warning-bg": "var(--warning)",
  "--warning-border": "var(--warning)",
  "--warning-text": "var(--warning-foreground)",
  "--info-bg": "var(--info)",
  "--info-border": "var(--info)",
  "--info-text": "var(--info-foreground)",
};

type ToasterProps = {
  /**
   * Token teması. Sonner yalnız `light`/`dark` bilir; sepya açık tema
   * sayılır. Varsayılan uygulamanın koyu temasıdır.
   */
  theme?: ThemeName;
};

/**
 * Bildirim katmanı (K-01). `src/app/layout.tsx` içinde bir kez render edilir.
 * Durum simgeleri token rengiyle gelir; gövde ise sakin yüzey + kenarlıktır.
 */
export function Toaster({ theme = "dark" }: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      theme={theme === "dark" ? "dark" : "light"}
      style={toasterStyle}
      icons={{
        success: <CircleCheck aria-hidden="true" className="size-4 text-positive" />,
        error: <CircleAlert aria-hidden="true" className="size-4 text-negative" />,
        warning: <TriangleAlert aria-hidden="true" className="size-4 text-warning" />,
        info: <Info aria-hidden="true" className="size-4 text-info" />,
        loading: <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />,
      }}
    />
  );
}
