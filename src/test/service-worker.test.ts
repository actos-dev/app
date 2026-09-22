/**
 * Service worker sanity testleri (Faz 6 / Birim 6.4, plan M-12).
 *
 * `public/sw.js` el yazımı bir dosyadır; tarayıcıda çalıştırılamadığı için
 * içeriği statik olarak doğrulanır: kritik olaylar, API dışlaması, sürümlü
 * cache ve çevrimdışı yedek davranışı.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SW_PATH = join(import.meta.dirname, "..", "..", "public", "sw.js");
const sw = readFileSync(SW_PATH, "utf8");

describe("service worker (6.4)", () => {
  it("install/activate/fetch olaylarını ve yaşam döngüsünü içerir", () => {
    expect(sw).toContain('addEventListener("install"');
    expect(sw).toContain('addEventListener("activate"');
    expect(sw).toContain('addEventListener("fetch"');
    expect(sw).toContain("skipWaiting");
    expect(sw).toContain("clients.claim");
  });

  it("API isteklerini önbelleğe almaz", () => {
    expect(sw).toContain('url.pathname.startsWith("/api/")');
  });

  it("sürümlü cache adı kullanır ve eski cache'leri temizler", () => {
    expect(sw).toMatch(/CACHE_NAME = "florence-v\d+"/);
    expect(sw).toContain("caches.delete");
  });

  it("çevrimdışı sayfasını ön belleğe alır ve yedek olarak döner", () => {
    expect(sw).toContain('OFFLINE_URL = "/offline"');
    expect(sw).toContain("cache.addAll");
    expect(sw).toContain("cache.match(OFFLINE_URL)");
  });

  it("yalnız GET ve same-origin istekleri ele alır", () => {
    expect(sw).toContain('request.method !== "GET"');
    expect(sw).toContain("url.origin !== self.location.origin");
  });

  it("indirme ve büyük yanıtları önbelleğe almaz", () => {
    expect(sw).toContain("Content-Disposition");
    expect(sw).toContain("MAX_CACHEABLE_BYTES");
  });
});
