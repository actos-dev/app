/**
 * Rapor Markdown görünümü (Faz 5 / Birim 5A.1, S-03, K-09).
 *
 * Gerçek sanitizasyon ve render mantığı paylaşılan `Markdown` bileşenine
 * taşındı (K-09: "Markdown bileşeni modül seviyesine"); bu bileşen rapor
 * çağrı yerlerinin değişmemesi için ince bir sarmalayıcıdır. Detay sayfası ilk
 * HTML'de markdown'ı SSR eder, istemci hidrasyonda aynı ağacı devralır.
 */
import { Markdown } from "@/components/shared/Markdown";

type ReportMarkdownProps = {
  content: string;
  className?: string;
};

export function ReportMarkdown({ content, className }: ReportMarkdownProps) {
  return <Markdown content={content} className={className} />;
}
