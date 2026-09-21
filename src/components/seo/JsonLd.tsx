/**
 * JSON-LD yerleştirme (plan X-06, S-19).
 *
 * Yapısal veri, çalıştırılabilir script DEĞİL, `<script type="application/ld+json">`
 * içinde düz metin olarak yerleştirilir. `dangerouslySetInnerHTML` proje lint
 * kuralıyla yasaktır (S-03); React, `<script>` etiketinin metin çocuklarını
 * ham (escape'siz) yazar, bu yüzden `JSON.stringify` çıktısını doğrudan çocuk
 * olarak vermek güvenli ve yeterlidir. XSS'i kapatmak için `<` karakteri
 * `\u003c` ile değiştirilir (Next.js dokümanındaki öneri); böylece `</script>`
 * enjeksiyonu imkânsız olur.
 *
 * Sunucu/istemci ortak: SSR HTML'inde de aynı metin üretilir, crawler'lar
 * JS'siz okur.
 */
type JsonLdProps = {
  /** `@context` dahil tam JSON-LD nesnesi. */
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json">
      {JSON.stringify(data).replace(/</g, "\\u003c")}
    </script>
  );
}
