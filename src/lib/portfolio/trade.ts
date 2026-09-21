/**
 * Al/sat komisyon ve toplam hesabı (Faz 4 / Birim 4.2, U-04, U-05).
 *
 * Backend `_add_transaction` mantığı birebir yansıtılır: komisyon
 * `subtotal * rate` (2 basamağa yuvarlı), ALIŞ'ta maliyete EKLENİR, SATIŞ'ta
 * hasılattan DÜŞÜLÜR. Oran tek kaynaktan (`NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE`)
 * okunur; geçersiz/eksik değerde backend varsayılanı `0.001` kullanılır.
 *
 * Saf fonksiyonlar: test edilebilir, sunucu/istemci aynı sonucu üretir.
 */
import type { TradeType } from "./types";

/** Backend varsayılanı (`PORTFOLIO_COMMISSION_RATE`, `backend/.env`). */
export const DEFAULT_COMMISSION_RATE = 0.001;

/**
 * Komisyon oranını çözer.
 *
 * `NEXT_PUBLIC_*` build sırasında inline edilir; bu yüzden tarayıcıda da
 * erişilebilir. Türkçe klavye alışkanlığı için ondalık virgül kabul edilir.
 */
export function getCommissionRate(
  raw: string | undefined = process.env.NEXT_PUBLIC_PORTFOLIO_COMMISSION_RATE,
): number {
  if (raw === undefined || raw === null || raw.trim() === "") {
    return DEFAULT_COMMISSION_RATE;
  }
  const parsed = Number(raw.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_COMMISSION_RATE;
}

export type TradeTotals = {
  subtotal: number;
  commission: number;
  /** ALIŞ: ödenecek toplam (komisyon dahil); SATIŞ: net alınacak (komisyon düşülmüş). */
  total: number;
};

/**
 * Fiyat ve adetten işlem tutarlarını üretir.
 *
 * Geçersiz (sıfır/negatif/sayı olmayan) fiyat veya adette `null` döner;
 * UI bu durumda tutar satırını göstermez.
 */
export function computeTradeTotals(
  price: number | null | undefined,
  quantity: number | null | undefined,
  type: TradeType,
  rate: number = getCommissionRate(),
): TradeTotals | null {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return null;
  }
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }
  const subtotal = price * quantity;
  const commission = Math.round(subtotal * rate * 100) / 100;
  const total =
    type === "BUY"
      ? Math.round((subtotal + commission) * 100) / 100
      : Math.round((subtotal - commission) * 100) / 100;
  return { subtotal, commission, total };
}

/** Adet gösterimi: tam sayıysa ondalıksız, değilse 2 basamak (eski davranış). */
export function formatQuantity(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}
