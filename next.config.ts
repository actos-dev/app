import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { legacyRedirects } from "./src/config/redirects";
import { securityHeaderRules } from "./src/config/security-headers";

const nextConfig: NextConfig = {
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
