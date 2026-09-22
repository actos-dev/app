"use client";

/**
 * Web-vitals RUM köprüsü (plan S-09, Faz 6).
 *
 * `useReportWebVitals` LCP/INP/CLS/FCP/TTFB metriklerini verir; geri çağrı
 * modül düzeyinde sabittir (Next yeniden raporlamayı böylece engeller).
 * Rıza kapısı `track` içindedir: rıza yoksa hiçbir istek üretilmez.
 *
 * Bilinçli sınır: eşik aşımı için ayrı uyarı mekanizması kurulmaz; veri
 * toplamak bu birimin kapsamıdır.
 */
import { useReportWebVitals } from "next/web-vitals";

import { reportWebVital } from "@/lib/telemetry";

export function WebVitals() {
  useReportWebVitals(reportWebVital);

  return null;
}
