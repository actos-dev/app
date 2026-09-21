/**
 * İndirme yardımcıları testleri (Faz 5 / Birim 5B.3).
 *
 * Dosya adı güvenliği (yol aşımı/kontrol karakteri) ve `download_url`'den
 * token çıkarma davranışı doğrulanır.
 */
import { describe, expect, it } from "vitest";

import { extractDownloadToken, safeFilename } from "@/lib/data-center/download";

describe("safeFilename", () => {
  it("yol ayraçlarını temizler ve taban adı korur", () => {
    expect(safeFilename("../../etc/passwd", "fallback.gz")).toBe("passwd");
    expect(safeFilename("C:\\Windows\\evil.exe", "fallback.gz")).toBe("evil.exe");
  });

  it("kontrol karakterlerini temizler", () => {
    expect(safeFilename("florence\u0000-daily.gz", "fallback.gz")).toBe("florence_-daily.gz");
  });

  it("boş veya yol olan adlarda fallback döner", () => {
    expect(safeFilename("", "fallback.gz")).toBe("fallback.gz");
    expect(safeFilename(null, "fallback.gz")).toBe("fallback.gz");
    expect(safeFilename("..", "fallback.gz")).toBe("fallback.gz");
  });
});

describe("extractDownloadToken", () => {
  it("geçerli indirme yolundan token'ı çıkarır", () => {
    expect(extractDownloadToken("/api/v1/data/export/download/abc_123-XYZ")).toBe("abc_123-XYZ");
  });

  it("yol ön eki yoksa veya token geçersizse null döner", () => {
    expect(extractDownloadToken(null)).toBeNull();
    expect(extractDownloadToken("/api/v1/other/abc")).toBeNull();
    expect(extractDownloadToken("/api/v1/data/export/download/../secret")).toBeNull();
  });
});
