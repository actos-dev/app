/**
 * `safeExternalUrl` testleri (Faz 2 / Birim 2.3b).
 *
 * Yalnız http/https kabul edilir; `javascript:`/`data:` gibi şemalar ve
 * göreli/desteksiz değerler reddedilir.
 */
import { describe, expect, it } from "vitest";

import { safeExternalUrl } from "@/lib/safe-url";

describe("safeExternalUrl", () => {
  it("http ve https adreslerini kabul eder", () => {
    expect(safeExternalUrl("https://github.com/project-florence")).toBe(
      "https://github.com/project-florence",
    );
    expect(safeExternalUrl("http://example.com/path?q=1")).toBe("http://example.com/path?q=1");
  });

  it("baştaki/sondaki boşlukları kırpar", () => {
    expect(safeExternalUrl("  https://example.com  ")).toBe("https://example.com/");
  });

  it("javascript: ve data: şemalarını reddeder", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("JavaScript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeExternalUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("desteklenmeyen şemaları ve göreli adresleri reddeder", () => {
    expect(safeExternalUrl("ftp://example.com")).toBeNull();
    expect(safeExternalUrl("/relative/path")).toBeNull();
    expect(safeExternalUrl("example.com")).toBeNull();
  });

  it("boş ve string olmayan değerlerde null döner", () => {
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl("   ")).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl(42)).toBeNull();
  });
});
