import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16'da stable: statik olarak tiplenmiş Link/route çıktısı.
  typedRoutes: true,
};

export default nextConfig;
