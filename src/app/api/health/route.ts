/**
 * Sağlık kontrolü (Faz 6 / Birim 6.5, plan M-11).
 *
 * Docker `HEALTHCHECK` ve deploy smoke testi bu uca bakar; ayrıca nginx
 * yükseltme öncesi ayakta mı kontrolü için kullanılır. `/api/*` proxy
 * matcher'ı tarafından atlanır (bkz. `src/proxy.ts`), bu yüzden burada CSP
 * nonce üretilmez ve yanıt hızlıdır.
 *
 * Backend'e BAĞIMLI DEĞİLDİR: yalnız "container ayakta ve HTTP yanıtlıyor"
 * sorusunu yanıtlar. Backend/DB sağlığı ayrı izlenir; aksi halde geçici bir
 * backend kesintisi tüm frontend container'larını unhealthy gösterirdi.
 */
import { NextResponse } from "next/server";

import { APP_VERSION } from "@/config/version";

export const runtime = "nodejs";
// Sağlık yanıtı asla önbelleğe alınmamalı: reverse proxy/CDN önbelleği
// deploy sonrası eski sürümü göstermemeli.
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(
    { status: "ok", version: APP_VERSION },
    { headers: { "cache-control": "no-store" } },
  );
}
