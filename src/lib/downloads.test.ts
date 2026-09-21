/**
 * İndirme manifesti testleri (Faz 2 / Birim 2.3b).
 *
 * Manifest dosya sisteminden okunur; ayrıştırma ve gruplama saf fonksiyonlarda
 * kalır ki dosya olmadan da doğrulanabilsin.
 */
import { describe, expect, it } from "vitest";

import {
  downloadFileType,
  groupDownloads,
  parseDownloadsManifest,
} from "@/lib/downloads";

describe("parseDownloadsManifest", () => {
  it("geçerli manifesti daraltır ve dosyaları süzer", () => {
    expect(
      parseDownloadsManifest({
        version: "0.6.0",
        files: ["a.exe", 3, "", "b.dmg"],
      }),
    ).toEqual({ version: "0.6.0", files: ["a.exe", "b.dmg"] });
  });

  it("bozuk veya eksik gövdede null döner", () => {
    expect(parseDownloadsManifest(null)).toBeNull();
    expect(parseDownloadsManifest([])).toBeNull();
    expect(parseDownloadsManifest({ files: ["a.exe"] })).toBeNull();
    expect(parseDownloadsManifest({ version: "", files: [] })).toBeNull();
    expect(parseDownloadsManifest({ version: "1.0.0", files: "nope" })).toBeNull();
  });
});

describe("groupDownloads", () => {
  it("dosyaları platforma göre gruplar, boşları atlar", () => {
    const groups = groupDownloads(["a.exe", "b.dmg", "c.deb", "notes.txt"]);
    expect(groups).toEqual([
      { platform: "windows", files: ["a.exe"] },
      { platform: "macos", files: ["b.dmg"] },
      { platform: "linux", files: ["c.deb"] },
    ]);
  });

  it("eşleşme yoksa boş dizi döner", () => {
    expect(groupDownloads(["notes.txt"])).toEqual([]);
  });
});

describe("downloadFileType", () => {
  it("uzantıyı i18n etiket anahtarına eşler", () => {
    expect(downloadFileType("Florence_0.6.0_x64-setup.exe")).toBe("installer");
    expect(downloadFileType("Florence_0.6.0_x64.msi")).toBe("installer");
    expect(downloadFileType("Florence_0.6.0_aarch64.dmg")).toBe("disk");
    expect(downloadFileType("Florence_0.6.0_aarch64.app.tar.gz")).toBe("archive");
    expect(downloadFileType("Florence_0.6.0_amd64.deb")).toBe("package");
    expect(downloadFileType("Florence_0.6.0_amd64.AppImage")).toBe("executable");
  });
});
