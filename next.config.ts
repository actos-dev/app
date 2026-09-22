import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { legacyRedirects } from "./src/config/redirects";
import { securityHeaderRules } from "./src/config/security-headers";

const nextConfig: NextConfig = {
  // Üretim çıktısı: `.next/standalone` (Faz 6 / Birim 6.5, plan M-11).
  // Docker imajı yalnız gerekli dosyaları taşır; `node server.js` ile çalışır.
  // Yerel/E2E akışları `next start` kullanmaya devam eder (standalone bunu
  // kaldırmaz, yalnız ek bir dağıtım çıktısı üretir).
  output: "standalone",
  // Standalone dosya izleme kökü proje dizinine sabitlenir. Aksi halde Next
  // üst dizinlerdeki `package-lock.json` dosyalarını (ör. kullanıcı ana
  // dizini) workspace kökü sanıp izlemeyi yanlış yere taşıyabilir; bu da
  // `.next/standalone` içeriğini belirsizleştirir. `next build` daima proje
  // kökünden çalışır (npm script + Docker WORKDIR).
  outputFileTracingRoot: process.cwd(),
  // Next 16'da stable: statik olarak tiplenmiş Link/route çıktısı.
  typedRoutes: true,
  // Eski SPA URL'leri → yeni route haritası (S-27); hepsi kalıcı (308).
  async redirects() {
    return legacyRedirects;
  },
  // HSTS, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options
  // (plan S-05). CSP istek başına nonce taşıdığı için proxy'de yazılır.
  async headers() {
    return securityHeaderRules();
  },
};

// Varsayılan istek yapılandırması yolu: src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
