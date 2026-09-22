// @vitest-environment node
/**
 * `/api/health` testleri (Faz 6 / Birim 6.5, plan M-11).
 *
 * Docker HEALTHCHECK bu yanıtın şekline ve sürüme bağlıdır; sürüm tek kaynak
 * `package.json`'dan gelmelidir. Node ortamı gerekir çünkü handler `next/server`
 * yanıtı üretir.
 */
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";
import packageJson from "../../../../package.json";

describe("GET /api/health", () => {
  it("200 ile {status:'ok', version} döner", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      version: packageJson.version,
    });
  });
});
