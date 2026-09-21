import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CellData, ColumnDef } from "@tanstack/react-table";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { renderWithIntl } from "@/test/test-utils";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

type Row = { ticker: string; price: number };

const columns: ColumnDef<DataTableFeatureSet, Row, CellData>[] = [
  { accessorKey: "ticker", header: "Sembol" },
  { accessorKey: "price", header: "Fiyat", meta: { align: "right" } },
];

function buildRows(count: number): Row[] {
  return Array.from({ length: count }, (_, index) => ({
    ticker: `T${index}`,
    price: index + 1,
  }));
}

// jsdom öğe boyutlarını 0 döndürür; sanallaştırıcı görünüm penceresini
// hesaplayabilsin diye sabit bir yükseklik/genişlik taklit edilir.
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

describe("DataTable — sanallaştırma (P-07)", () => {
  it("500 satırda yalnız görünür pencereyi DOM'a basar", () => {
    const data = buildRows(500);
    const startedAt = performance.now();
    const { container } = renderWithIntl(
      <DataTable columns={columns} data={data} sortingMode="none" ariaLabel="Hisseler" />,
    );
    const elapsedMs = performance.now() - startedAt;

    const renderedRows = container.querySelectorAll('[role="row"][data-index]').length;
    const table = container.querySelector('[role="table"]');

    console.log(
      `[DataTable] 500 satır: ${elapsedMs.toFixed(1)}ms, DOM satır sayısı: ${renderedRows}`,
    );

    expect(renderedRows).toBeGreaterThan(1);
    expect(renderedRows).toBeLessThan(80);
    expect(table).toHaveAttribute("aria-rowcount", "500");
    expect(screen.getByText("T0")).toBeInTheDocument();
  });

  it("numerik sütun meta hizasını uygular", () => {
    const { container } = renderWithIntl(
      <DataTable columns={columns} data={buildRows(5)} sortingMode="none" />,
    );
    expect(container.querySelector('[role="cell"].text-right')).not.toBeNull();
  });
});

describe("DataTable — sıralama (kontrollü/sunucu)", () => {
  it("başlık tıklamasında onSortingChange callback'ini çağırır", async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();
    renderWithIntl(
      <DataTable
        columns={columns}
        data={buildRows(20)}
        sortingMode="server"
        sorting={[]}
        onSortingChange={onSortingChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Sembol/ }));

    expect(onSortingChange).toHaveBeenCalledTimes(1);
    const nextSorting = onSortingChange.mock.calls[0][0] as { id: string; desc: boolean }[];
    expect(nextSorting[0]?.id).toBe("ticker");
  });

  it("boş başlıkta aria-sort=none, sıralı başlıkta ascending bildirir", () => {
    const { container, rerender } = renderWithIntl(
      <DataTable
        columns={columns}
        data={buildRows(5)}
        sortingMode="server"
        sorting={[]}
        onSortingChange={() => {}}
      />,
    );
    const headers = () => container.querySelectorAll('[role="columnheader"]');
    expect(headers()[0]).toHaveAttribute("aria-sort", "none");

    rerender(
      <DataTable
        columns={columns}
        data={buildRows(5)}
        sortingMode="server"
        sorting={[{ id: "ticker", desc: false }]}
        onSortingChange={() => {}}
      />,
    );
    expect(headers()[0]).toHaveAttribute("aria-sort", "ascending");
  });
});

describe("DataTable — satır aktivasyonu (A-02)", () => {
  it("Enter ve Space ile satır bağlantısını açar", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(
      <DataTable
        columns={columns}
        data={buildRows(3)}
        sortingMode="none"
        rowHref={() => "/markets"}
      />,
    );

    const row = container.querySelector<HTMLDivElement>('[role="row"][tabindex="0"]');
    expect(row).not.toBeNull();
    if (!row) return;

    row.focus();
    await user.keyboard("{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/markets");

    pushMock.mockClear();
    fireEvent.keyDown(row, { key: " " });
    expect(pushMock).toHaveBeenCalledWith("/markets");
  });
});

describe("DataTable — durumlar", () => {
  it("boş veride EmptyState gösterir", () => {
    renderWithIntl(<DataTable columns={columns} data={[]} sortingMode="none" />);
    expect(screen.getByText("Gösterilecek kayıt yok.")).toBeInTheDocument();
  });

  it("hata durumunda ErrorState ve tekrar dene gösterir", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderWithIntl(
      <DataTable
        columns={columns}
        data={[]}
        sortingMode="none"
        error
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("yüklenme sırasında iskelet satırlar ve aria-busy gösterir", () => {
    const { container } = renderWithIntl(
      <DataTable
        columns={columns}
        data={[]}
        sortingMode="none"
        isLoading
        loadingRowCount={6}
      />,
    );
    expect(container.querySelector('[role="table"]')).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll('[role="row"][data-index]').length).toBe(0);
    expect(container.querySelectorAll('[role="row"]').length).toBeGreaterThanOrEqual(6);
  });
});
