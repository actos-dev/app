# 0008 — Güvenlik başlıkları ve CSP nonce

**Durum:** Kabul edildi · **Tarih:** 2026-09-22

## Bağlam

Faz 6 / S-05: tarayıcı güvenlik başlıkları eklenir. Eski SPA nginx'i yalnız
`script-src 'self'` yazıyordu ve Next inline bootstrap'ını engellerdi. Next 16
dokümanı (`content-security-policy.md`) nonce'ın istekteki `Content-Security-Policy`
başlığından `'nonce-{değer}'` ile çıkarılıp framework script'lerine uygulandığını ve
bunun yalnız **dinamik render** edilen sayfalarda çalıştığını söyler. Kök layout
dil/tema/rıza için `cookies()` okuduğundan tüm uygulama zaten dinamiktir.

## Karar

- **Statik başlıklar** `next.config.ts::headers()` (kaynak `src/config/security-headers.ts`):
  HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (kullanılmayan API'ler kapalı), `X-Frame-Options: SAMEORIGIN`.
- **CSP** istek başına `src/proxy.ts`'te: `default-src 'self'`,
  `script-src 'self' 'nonce-<n>' 'strict-dynamic'` (+ geliştirmede `'unsafe-eval'`),
  `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `font-src 'self'`,
  `connect-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
  `frame-ancestors 'none'`. Nonce hem istek hem yanıt başlığına yazılır.
- Proxy matcher'ı tüm belge rotalarını kapsar (`/api`, `_next`, noktalı dosyalar hariç);
  oturum kapısı `isProtectedPath(pathname)` yardımcısına taşındı.
- `style-src` nonce İÇERMEZ: nonce varken `'unsafe-inline'` yok sayılır ve inline
  `style` nitelikleri kırılır (Next'in nonce'suz örneği de böyledir).

## Sonuçlar

- `frame-ancestors 'none'` ile `X-Frame-Options: SAMEORIGIN` bilinçli birlikte gönderilir;
  modern tarayıcıda CSP, eski tarayıcıda XFO geçerlidir.
- Nonce dinamik render gerektirir; mevcut mimaride ek maliyet yoktur.

## Alternatifler

- **Nonce'suz CSP** (`'unsafe-inline'`): inline script XSS yüzeyi kalır; reddedildi.
- **SRI/hash CSP** (`experimental.sri`): statik üretimi korur ama deneysel; v1 dışı.
- **nginx'te CSP**: istek başına nonce'ı Next ile paylaşmak zor; reddedildi.
