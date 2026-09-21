/**
 * CSV dosya adı testleri (Faz 4 / Birim 4.3).
 *
 * Backend `Content-Disposition` göndermediği için adı istemci üretir; Türkçe
 * harfler ASCII'ye katlanır ve güvensiz karakterler tireye indirgenir.
 */
import { describe, expect, it } from "vitest";

import { buildPortfolioCsvFilename, sanitizeFileSegment } from "@/lib/portfolio/csv";

describe("sanitizeFileSegment", () => {
  it("Türkçe harfleri ASCII'ye katlar", () => {
    expect(sanitizeFileSegment("Uzun Vade")).toBe("uzun-vade");
    expect(sanitizeFileSegment("ÇĞİÖŞÜ A.Ş.")).toBe("cgiosu-a-s");
  });

  it("güvensiz karakterleri tireye çevirir ve baş/son tireyi kırpar", () => {
    expect(sanitizeFileSegment("  a/b:c*?  ")).toBe("a-b-c");
  });

  it("güvenli parça kalmazsa boş döner", () => {
    expect(sanitizeFileSegment("!!!")).toBe("");
  });

  it("uzunluğu sınırlar", () => {
    expect(sanitizeFileSegment("a".repeat(100))).toHaveLength(60);
  });
});

describe("buildPortfolioCsvFilename", () => {
  it("önek + güvenli ad + .csv üretir", () => {
    expect(buildPortfolioCsvFilename("portfoy", "Uzun Vade", "id")).toBe(
      "portfoy-uzun-vade.csv",
    );
  });

  it("ad güvenli parça bırakmıyorsa kimliğe düşer", () => {
    expect(buildPortfolioCsvFilename("portfoy", "!!!", "Port-1")).toBe("portfoy-port-1.csv");
  });
});
