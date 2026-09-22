/**
 * Manifest testleri (Faz 6 / Birim 6.4, plan M-12).
 *
 * `manifest()` çıktısı PWA kurulabilirliği için zorunlu alanları ve üretilen
 * ikon yollarını taşımalıdır. `getTranslations` gerçek `tr` kataloğuyla
 * çözülür; böylece metinler de doğrulanır.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../messages/tr.json")).default as Record<string, unknown>;
  const resolve = (namespace: string | undefined, key: string): string => {
    const path = namespace ? `${namespace}.${key}` : key;
    let current: unknown = messages;
    for (const part of path.split(".")) {
      current =
        current !== null && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined;
    }
    return typeof current === "string" ? current : path;
  };
  return {
    getTranslations: (namespace?: string) =>
      Promise.resolve((key: string) => resolve(namespace, key)),
  };
});

import manifest from "@/app/manifest";

describe("manifest (6.4)", () => {
  it("kurulabilirlik için zorunlu alanları taşır", async () => {
    const result = await manifest();

    expect(result.name).toBe("Florence");
    expect(result.short_name).toBe("Florence");
    expect(result.description).toBe("BIST piyasa takibi ve sanal portföy simülatörü.");
    expect(result.lang).toBe("tr");
    expect(result.start_url).toBe("/dashboard");
    expect(result.scope).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.background_color).toBe("#0b0e14");
    expect(result.theme_color).toBe("#0b0e14");
    expect(result.categories).toEqual(["finance", "business", "productivity"]);
  });

  it("192, 512 ve maskable ikon yollarını içerir", async () => {
    const icons = (await manifest()).icons ?? [];

    expect(icons).toContainEqual({
      src: "/pwa-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    });
    expect(icons).toContainEqual({
      src: "/pwa-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    });
    expect(icons).toContainEqual({
      src: "/pwa-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    });
  });
});
