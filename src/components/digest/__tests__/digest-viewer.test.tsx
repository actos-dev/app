/**
 * `DigestViewer` testleri (Faz 5 / Birim 5A.3, U-08, S-03).
 *
 * Başlık, tarih/slot rozetleri, bölümler ve AI üretimi Markdown'ın sanitize
 * edilerek render edilmesi doğrulanır (ham HTML etkisiz).
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestViewer } from "@/components/digest/DigestViewer";
import type { Digest } from "@/lib/digest/types";
import { renderWithIntl } from "@/test/test-utils";

const digest: Digest = {
  id: "d1",
  date: "2026-09-01",
  slot: "evening",
  title: "Kapanış bülteni",
  content: "**Kalın** özet.\n\n<script>alert('xss')</script>\n\n[zararlı](javascript:alert(1))",
  sections: [
    { heading: "Öne çıkanlar", body: "ASELS yükseldi." },
    { heading: "Riskler", body: "Kur baskısı sürüyor." },
  ],
  metadata: {},
  language: "tr",
  created_at: "2026-09-01T16:00:00Z",
};

describe("DigestViewer", () => {
  it("başlık, tarih/slot rozetleri ve bölümleri render eder", () => {
    renderWithIntl(<DigestViewer digest={digest} />);

    expect(screen.getByRole("heading", { level: 3, name: "Kapanış bülteni" })).toBeInTheDocument();
    expect(screen.getByText("2026-09-01")).toBeInTheDocument();
    expect(screen.getByText("Akşam")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Öne çıkanlar" })).toBeInTheDocument();
    expect(screen.getByText("ASELS yükseldi.")).toBeInTheDocument();
  });

  it("Markdown'ı sanitize eder; ham HTML ve javascript: şeması etkisizleşir", () => {
    const { container } = renderWithIntl(<DigestViewer digest={digest} />);

    expect(container.querySelector("script")).toBeNull();
    const anchors = Array.from(container.querySelectorAll("a"));
    expect(anchors.some((anchor) => anchor.getAttribute("href")?.startsWith("javascript:"))).toBe(
      false,
    );
    expect(screen.queryByRole("link", { name: "zararlı" })).not.toBeInTheDocument();
  });

  it("başlık boşsa yer tutucu gösterir", () => {
    renderWithIntl(<DigestViewer digest={{ ...digest, title: "   " }} />);
    expect(screen.getByRole("heading", { level: 3, name: "Başlıksız bülten" })).toBeInTheDocument();
  });
});
