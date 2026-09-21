/**
 * `ReportMarkdown` sanitizasyon testleri (Faz 5 / Birim 5A.1, S-03).
 *
 * AI üretimi içerik XSS yüzeyidir. Doğrulananlar:
 *   - GFM markdown (başlık, kalın, tablo) render edilir,
 *   - ham HTML (`<script>`, `onerror`) etkinleşmez,
 *   - `javascript:` bağlantısı tıklanabilir bağlantıya dönüşmez,
 *   - yalnız http/https dış bağlantılar `target`/`rel` ile render edilir.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportMarkdown } from "@/components/reports/ReportMarkdown";

const malicious = `# Başlık

**Kalın** metin ve [güvenli bağlantı](https://example.com).

[zararlı](javascript:alert(1))

<script>alert("xss")</script>

<img src="x" onerror="alert('xss')" />

| A | B |
| - | - |
| 1 | 2 |
`;

describe("ReportMarkdown", () => {
  it("GFM markdown'ı render eder", () => {
    render(<ReportMarkdown content={malicious} />);

    expect(screen.getByRole("heading", { level: 1, name: "Başlık" })).toBeInTheDocument();
    expect(screen.getByText("Kalın")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();

    const safeLink = screen.getByRole("link", { name: "güvenli bağlantı" });
    expect(safeLink).toHaveAttribute("href", "https://example.com/");
    expect(safeLink).toHaveAttribute("target", "_blank");
    expect(safeLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("zararlı HTML ve şemaları etkisizleştirir", () => {
    const { container } = render(<ReportMarkdown content={malicious} />);

    // Ham <script> hiçbir koşulda DOM'a script düğümü olarak girmez.
    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toContain("<script");

    // Olay nitelikleri (onerror) sanitize edilir; <img> varsa da tetiklenemez.
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector("img[onerror]")).toBeNull();

    // javascript: bağlantısı gerçek bir <a href> olmaz.
    const anchors = Array.from(container.querySelectorAll("a"));
    expect(anchors.some((anchor) => anchor.getAttribute("href")?.startsWith("javascript:"))).toBe(false);
    expect(screen.queryByRole("link", { name: "zararlı" })).not.toBeInTheDocument();
  });
});
