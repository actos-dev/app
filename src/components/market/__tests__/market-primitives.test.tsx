import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { Delta } from "@/components/market/Delta";
import { MarketStatusPill } from "@/components/market/MarketStatusPill";
import { PriceText } from "@/components/market/PriceText";
import { renderWithIntl } from "@/test/test-utils";
import type { MarketStatus } from "@/types/market";

function withQueryClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  return renderWithIntl(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const statusFixture: MarketStatus = {
  open: false,
  next_open_at: null,
  timezone: "Europe/Istanbul",
  is_holiday: false,
  holiday_name: null,
  as_of: new Date().toISOString(),
};

describe("Delta", () => {
  it("pozitif değeri işaret + ok + renk ile çift kodlar", () => {
    const { container } = renderWithIntl(<Delta value={2.41} percent />);
    const el = container.querySelector("[aria-label]");
    expect(el).toHaveAttribute("aria-label", expect.stringContaining("artış"));
    expect(el).toHaveTextContent("+2,41%");
    expect(el).toHaveClass("text-positive");
  });

  it("negatif değeri düşüş olarak işaretler", () => {
    const { container } = renderWithIntl(<Delta value={-1.18} percent />);
    const el = container.querySelector("[aria-label]");
    expect(el).toHaveAttribute("aria-label", expect.stringContaining("düşüş"));
    expect(el).toHaveTextContent("\u22121,18%");
    expect(el).toHaveClass("text-negative");
  });

  it("sıfır ve eksik değerde nötr kalır", () => {
    const { container: zero } = renderWithIntl(<Delta value={0} />);
    expect(zero.querySelector("[aria-label]")).toHaveAttribute(
      "aria-label",
      "Değişim yok",
    );

    const { container: missing } = renderWithIntl(<Delta value={null} />);
    expect(missing.querySelector("[aria-label]")).toHaveAttribute(
      "aria-label",
      "Değişim verisi yok",
    );
    expect(missing.querySelector("[aria-label]")).toHaveTextContent("—");
  });
});

describe("PriceText", () => {
  it("sayıyı tabular biçimde ve sonekiyle gösterir", () => {
    renderWithIntl(<PriceText value={1234.5} suffix="TRY" />);
    expect(screen.getByText("1.234,50")).toBeInTheDocument();
    expect(screen.getByText("TRY")).toBeInTheDocument();
  });

  it("geçersiz değerde soneki gizler", () => {
    renderWithIntl(<PriceText value={null} suffix="TRY" />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("TRY")).not.toBeInTheDocument();
  });
});

describe("MarketStatusPill", () => {
  it("açık durumu ve seans bilgisini erişilebilir kılar", () => {
    withQueryClient(<MarketStatusPill initialData={{ ...statusFixture, open: true }} />);
    const badge = screen.getByText("Açık");
    expect(badge).toHaveAttribute("aria-label", expect.stringContaining("10:00–18:10"));
  });

  it("kapalı + tatilde tatil adını gösterir", () => {
    withQueryClient(
      <MarketStatusPill
        initialData={{
          ...statusFixture,
          is_holiday: true,
          holiday_name: "Zafer Bayramı",
        }}
      />,
    );
    expect(screen.getByText("Kapalı").getAttribute("aria-label")).toContain("Zafer Bayramı");
  });

  it("kapalıyken sonraki açılış bilgisini gösterir", () => {
    withQueryClient(
      <MarketStatusPill
        initialData={{ ...statusFixture, next_open_at: "2026-09-22T07:00:00Z" }}
      />,
    );
    expect(screen.getByText("Kapalı").getAttribute("aria-label")).toContain(
      "Sonraki açılış",
    );
  });
});
