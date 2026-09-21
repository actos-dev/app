/**
 * Piyasa tabloları testleri (Faz 3 / Birim 3.2).
 *
 * - `MarketsTabs`: sekme bağlantıları doğru `href` üretir ve aktif sekme
 *   `aria-current="page"` taşır (link tabanlı, JS'siz çalışır).
 * - `StocksTable`: sunucu modunda sıralama/sayfa değişimi callback ile
 *   URL'e yansıtılır (`router.push`).
 * - `EconomyTable`: FX/metal satırları istemcide sıralanır; ek istek yok.
 */
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { EconomyTable } from "@/components/market/EconomyTable";
import { MarketsTabs } from "@/components/market/MarketsTabs";
import { StocksTable } from "@/components/market/StocksTable";
import { renderWithIntl } from "@/test/test-utils";
import type {
  CompanySummary,
  CompanySummaryResponse,
  EconomyQuoteBundle,
} from "@/types/market";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

// jsdom öğe boyutlarını 0 döndürür; sanallaştırıcı görünüm penceresini
// hesaplayabilsin diye sabit yükseklik/genişlik taklit edilir.
const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight",
);
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth",
);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 480,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 800,
  });
});

afterAll(() => {
  if (originalOffsetHeight) {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
  }
  if (originalOffsetWidth) {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  }
});

function company(overrides: Partial<CompanySummary> & { ticker: string }): CompanySummary {
  return {
    name: `${overrides.ticker} A.Ş.`,
    sector: null,
    last_price: 100,
    change_pct: 1,
    previous_close: 99,
    absolute_change: 1,
    change_window: "last_session_change",
    market_status: "open",
    is_stale: false,
    as_of: "2026-09-21T08:00:00Z",
    previous_close_as_of: null,
    day_high: null,
    day_low: null,
    volume: 1000,
    market_cap: 1_000_000,
    currency: "TRY",
    price_updated_at: null,
    ...overrides,
  };
}

const companiesResponse: CompanySummaryResponse = {
  data: [company({ ticker: "ASELS" }), company({ ticker: "THYAO", change_pct: -2 })],
  total: 100,
};

describe("MarketsTabs — link tabanlı sekmeler", () => {
  it("her sekme için doğru href üretir ve aktif olanı işaretler", () => {
    renderWithIntl(<MarketsTabs active="fx" />);

    const nav = screen.getByRole("navigation", { name: "Varlık türü" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/markets?asset=stocks",
      "/markets?asset=fx",
      "/markets?asset=metals",
      "/markets?asset=ipos",
    ]);

    expect(screen.getByRole("link", { name: "Döviz" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Hisseler" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("StocksTable — sunucu modu", () => {
  it("sıralama seçimini URL parametresine yansıtır (sayfa 1'e döner)", async () => {
    const user = userEvent.setup();
    renderWithIntl(<StocksTable initialData={companiesResponse} sort="popular" page={3} />);

    await user.click(screen.getByRole("combobox", { name: "Sıralama" }));
    await user.click(await screen.findByRole("option", { name: "Yükselenler" }));

    expect(pushMock).toHaveBeenCalledWith("/markets?asset=stocks&sort=gainers");
  });

  it("başlık tıklaması backend sort değerine çevrilir", async () => {
    const user = userEvent.setup();
    renderWithIntl(<StocksTable initialData={companiesResponse} sort="popular" page={1} />);

    await user.click(screen.getByRole("button", { name: /Değişim/ }));

    expect(pushMock).toHaveBeenCalledWith("/markets?asset=stocks&sort=gainers");
  });

  it("sayfa ilerletme offset'i URL'e yansıtır", async () => {
    const user = userEvent.setup();
    renderWithIntl(<StocksTable initialData={companiesResponse} sort="popular" page={1} />);

    await user.click(screen.getByRole("button", { name: "Sonraki" }));

    expect(pushMock).toHaveBeenCalledWith("/markets?asset=stocks&page=2");
  });

  it("toplam sonucu ve tablo satır sayısını backend yanıtından alır", () => {
    renderWithIntl(<StocksTable initialData={companiesResponse} sort="popular" page={1} />);

    expect(screen.getByText("100 sonuç")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Hisseler" });
    expect(table).toHaveAttribute("aria-rowcount", "100");
  });

  it("hata durumunda ErrorState gösterir", () => {
    renderWithIntl(<StocksTable initialData={null} sort="popular" page={1} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("EconomyTable — istemci sıralama (P-02)", () => {
  const bundle: EconomyQuoteBundle = {
    ts: "2026-09-21T08:00:00Z",
    source: "genelpara",
    quotes: {
      USD: {
        symbol: "USD",
        buying: 41.2,
        selling: 41.3,
        price: 41.25,
        change_pct: 0.1,
        change_text: null,
        currency: "TRY",
        unit: "1",
        source: "genelpara",
        ts: "2026-09-21T08:00:00Z",
        stale: false,
        extra: {},
      },
      EUR: {
        symbol: "EUR",
        buying: 48.5,
        selling: 48.7,
        price: 48.6,
        change_pct: 1.4,
        change_text: null,
        currency: "TRY",
        unit: "1",
        source: "genelpara",
        ts: "2026-09-21T08:00:00Z",
        stale: true,
        extra: {},
      },
    },
    remaining: null,
  };

  it("tüm satırları tek yanıttan render eder ve gecikmeli işaretini gösterir", () => {
    renderWithIntl(<EconomyTable asset="fx" initialData={bundle} />);

    expect(screen.getByText("USD")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getByText("Gecikmeli")).toBeInTheDocument();
    expect(screen.getByText(/Kaynak: genelpara/)).toBeInTheDocument();
  });

  it("sıralama başlığına tıklayınca satır sırası değişir (fetch yok)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { container } = renderWithIntl(<EconomyTable asset="fx" initialData={bundle} />);

    const rowSymbols = () =>
      Array.from(container.querySelectorAll('[role="row"][data-index]')).map(
        (row) => row.textContent?.slice(0, 3),
      );

    // İlk sıralama change_pct desc (EUR %1,4 > USD %0,1).
    expect(rowSymbols()[0]).toContain("EUR");

    fireEvent.click(screen.getByRole("button", { name: /Değişim/ }));
    expect(rowSymbols()[0]).toContain("USD");

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("fiyat sütununa göre sıralar (ilk tıklama azalan, ikinci artan)", async () => {
    const { container } = renderWithIntl(<EconomyTable asset="fx" initialData={bundle} />);
    const firstSymbol = () =>
      container.querySelector('[role="row"][data-index]')?.textContent ?? "";

    // İlk tıklama: azalan (EUR 48,5 > USD 41,2).
    fireEvent.click(screen.getByRole("button", { name: /Alış/ }));
    expect(firstSymbol()).toContain("EUR");

    // İkinci tıklama: artan (USD önce).
    fireEvent.click(screen.getByRole("button", { name: /Alış/ }));
    expect(firstSymbol()).toContain("USD");
  });

  it("boş yanıtta boş durum gösterir", () => {
    renderWithIntl(<EconomyTable asset="fx" initialData={{ ...bundle, quotes: {} }} />);
    expect(screen.getByText("Gösterilecek kayıt yok.")).toBeInTheDocument();
  });

  it("backend kapalıyken hata durumu gösterir", () => {
    renderWithIntl(<EconomyTable asset="metals" initialData={null} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
