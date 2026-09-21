import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { legacyRedirects } from "./src/config/redirects";

const nextConfig: NextConfig = {
  // Next 16'da stable: statik olarak tiplenmiş Link/route çıktısı.
  typedRoutes: true,
  // Eski SPA URL'leri → yeni route haritası (S-27); hepsi kalıcı (308).
  async redirects() {
    return legacyRedirects;
  },
};

// Varsayılan istek yapılandırması yolu: src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
