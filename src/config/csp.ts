/**
 * Content-Security-Policy ve nonce politikası (plan S-05, M-11, Faz 6).
 *
 * Bakım notu: Next 16 nonce'ı, istekte bulunan `Content-Security-Policy`
 * başlığındaki `'nonce-{değer}'` kalıbından çıkarır ve render sırasında
 * framework script'lerine, sayfa bundle'larına ve Next'in ürettiği inline
 * script/stil etiketlerine otomatik uygular (bkz.
 * `node_modules/next/dist/docs/.../content-security-policy.md`). Nonce'lu
 * sayfaların dinamik render edilmesi ZORUNLUDUR; kök layout `cookies()` okuduğu
 * için tüm uygulama zaten dinamiktir.
 *
 * `style-src` bilinçli olarak nonce İÇERMEZ: bir direktifte nonce bulununca
 * `'unsafe-inline'` yok sayılır ve inline `style` nitelikleri (ör. grafik
 * kütüphaneleri, next/font çıktısı) kırılır. Next'in kendi dokümanındaki
 * nonce'suz stil örneği de `'unsafe-inline'` kullanır.
 */
/** CSP yanıt/istek başlık adı. */
export const CSP_HEADER = "Content-Security-Policy";

/** Sunucu bileşenlerinin nonce'a erişebilmesi için istek başlığı adı. */
export const NONCE_HEADER = "x-nonce";

/** Tarayıcının `<script nonce>` eşleşmesinde kullandığı önek. */
export const NONCE_PATTERN = "nonce-";

/**
 * İstek başına kriptografik, tahmin edilemez nonce üretir (`base64`).
 *
 * `btoa` hem Node (18+) hem de jsdom ortamında bulunur; `Buffer` bağımlılığı
 * yoktur. UUID zaten ASCII olduğu için kodlama kayıpsızdır.
 */
export function generateNonce(): string {
  return btoa(crypto.randomUUID());
}

/**
 * Nonce'lu CSP politikasını kurar (saf; istekten bağımsız test edilebilir).
 *
 * Geliştirme modunda React'in hata ayıklama `eval` kullanımı için
 * `'unsafe-eval'` eklenir; üretimde eklenmez (Next dokümanı).
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const scriptEval = isDev ? " 'unsafe-eval'" : "";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${scriptEval}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    // Service worker kaydı (Faz 6 / Birim 6.4): `strict-dynamic` script-src'te
    // 'self'i geçersiz kıldığından worker-src AYRICA verilmelidir; aksi halde
    // tarayıcı `/sw.js` kaydını engelleyebilir.
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join("; ");
}

/**
 * Proxy için nonce + CSP bağlamını üretir; `NODE_ENV` okuma tek noktada kalır.
 */
export function createCspContext(): { nonce: string; csp: string } {
  const nonce = generateNonce();
  return { nonce, csp: buildCsp(nonce, process.env.NODE_ENV === "development") };
}
