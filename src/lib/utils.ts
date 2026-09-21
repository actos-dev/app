import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Koşullu sınıf listelerini birleştirir ve çakışan Tailwind sınıflarını
 * (son kazanan kuralıyla) tekilleştirir.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
