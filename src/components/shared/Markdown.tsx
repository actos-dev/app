/**
 * Paylaşılan Markdown görünümü (plan S-03, K-09).
 *
 * AI üretimi içerik (rapor, piyasa bülteni) XSS yüzeyidir. `react-markdown` +
 * `remark-gfm` (tablo/liste) + `rehype-sanitize` ile güvenli render: ham HTML
 * YASAKTIR ve sanitizasyon varsayılan GitHub şemasıyla uygulanır (`script`,
 * `on*` olay nitelikleri, `javascript:` şemaları düşer).
 * `dangerouslySetInnerHTML` kullanılmaz (lint kuralı). Dış bağlantılar
 * `safeExternalUrl` kapısından geçer.
 *
 * Sunucu/istemci ortak tutulur; hem SSR HTML'inde hem istemci hidrasyonunda
 * aynı ağaç üretilir. Tipografi `globals.css` içindeki `.report-markdown`
 * sınıfından gelir (tek kaynak).
 */
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { safeExternalUrl } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

/**
 * GitHub varsayılanı; yalnız `img` için `loading`/`decoding` nitelikleri
 * eklenir (şema genişletmesi minimal ve bilinçlidir). Ham HTML bu şemada
 * zaten yasaktır; `rehype-raw` KULLANILMAZ.
 */
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "loading", "decoding"],
  },
};

const components: Components = {
  a: ({ href, children }) => {
    const safe = safeExternalUrl(href);
    if (!safe) {
      // Güvenli olmayan/eksik adres: bağlantı değil düz metin render edilir.
      return <span>{children}</span>;
    }
    return (
      <a href={safe} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

type MarkdownProps = {
  content: string;
  className?: string;
};

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("report-markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
