/**
 * Güvenlik başlıkları testleri (plan S-05, Faz 6).
 *
 * `next.config.ts::headers()` çıktısının beklenen statik başlıkları içerdiği
 * doğrulanır; bu başlıklar tüm yollara uygulanır.
 */
import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import { SECURITY_HEADERS, securityHeaderRules } from "@/config/security-headers";

function toMap(headers: ReadonlyArray<{ key: string; value: string }>): Map<string, string> {
  return new Map(headers.map((header) => [header.key, header.value]));
}

describe("securityHeaderRules", () => {
  const rules = securityHeaderRules();

  it("tüm yollara uygulanır", () => {
    expect(rules).toHaveLength(1);
    expect(rules[0]?.source).toBe("/(.*)");
  });

  it("beklenen başlıkları ve değerleri taşır", () => {
    const headers = toMap(rules[0]?.headers ?? []);

    expect(headers.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Permissions-Policy")).toContain("geolocation=()");
  });

  it("sabit listeyi kopyalayarak döner (mutasyon sızmaz)", () => {
    const first = securityHeaderRules();
    first[0]?.headers.push({ key: "x-test", value: "1" });
    expect(SECURITY_HEADERS).toHaveLength(5);
    expect(securityHeaderRules()[0]?.headers).toHaveLength(5);
  });
});

describe("next.config headers()", () => {
  it("statik güvenlik başlıklarını üretir", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const headers = toMap(rules[0]?.headers ?? []);

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headers.get("Strict-Transport-Security")).toBeTruthy();
    expect(headers.get("Content-Security-Policy")).toBeUndefined();
  });
});
