import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Next 16'da stable: statik olarak tiplenmiş Link/route çıktısı.
  typedRoutes: true,
};

// Varsayılan istek yapılandırması yolu: src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
