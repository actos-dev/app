/**
 * `SymbolSearch` testleri (Faz 3 / Birim 3.2, A-02).
 *
 * Doğrulananlar: yazınca debounce sonrası sonuç gelmesi, ARIA combobox
 * nitelikleri, ok tuşları + Enter ile seçimin `/symbol/<ticker>`'a gitmesi,
 * Escape ile kapanma, dışarı tıklamayla kapanma, boş sonuç ve hata durumu.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SymbolSearch } from "@/components/market/SymbolSearch";
import { renderWithIntl } from "@/test/test-utils";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const results = [
  { ticker: "ASELS", name: "Aselsan Elektronik", score: 100 },
  { ticker: "ASUZU", name: "Anadolu Isuzu", score: 80 },
];

let fetchMock: ReturnType<typeof vi.fn>;

function installFetch(impl: () => Promise<Response> | Response) {
  fetchMock = vi.fn(() => Promise.resolve(impl()));
  vi.stubGlobal("fetch", fetchMock);
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  pushMock.mockReset();
  installFetch(() => jsonResponse(results));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const searchPaths = () =>
  fetchMock.mock.calls.map((call) => String(call[0])).filter((url) => url.includes("/companies/search"));

describe("SymbolSearch", () => {
  it("2 karakterden sonra debounce ile sonuç getirir ve combobox ARIA taşır", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SymbolSearch />);

    const input = screen.getByRole("combobox", { name: "Hisse ara" });
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.type(input, "AS");

    await waitFor(() => {
      expect(searchPaths().length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /ASELS/ })).toBeInTheDocument();
    });
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input.getAttribute("aria-controls")).toBeTruthy();
  });

  it("tek karakterde istek atmaz, ipucu gösterir", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SymbolSearch />);

    await user.type(screen.getByRole("combobox", { name: "Hisse ara" }), "A");

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(searchPaths()).toHaveLength(0);
    expect(screen.getAllByText("Aramak için en az 2 karakter yaz.").length).toBeGreaterThan(0);
  });

  it("ok tuşları + Enter ile seçimi `/symbol/<ticker>`'a yönlendirir", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SymbolSearch />);

    const input = screen.getByRole("combobox", { name: "Hisse ara" });
    await user.type(input, "AS");

    await screen.findByRole("option", { name: /ASELS/ });

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/symbol/ASELS");
    });
  });

  it("Escape popup'ı kapatır", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SymbolSearch />);

    const input = screen.getByRole("combobox", { name: "Hisse ara" });
    await user.type(input, "AS");
    await screen.findByRole("option", { name: /ASELS/ });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(input).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("dışarı tıklama popup'ı kapatır", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SymbolSearch />);

    const input = screen.getByRole("combobox", { name: "Hisse ara" });
    await user.type(input, "AS");
    await screen.findByRole("option", { name: /ASELS/ });

    // Body'ye tıklama dışarı sayılır (Base UI dismiss).
    await user.click(document.body);

    await waitFor(() => {
      expect(input).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("boş sonuçta mesaj gösterir", async () => {
    installFetch(() => jsonResponse([]));
    const user = userEvent.setup();
    renderWithIntl(<SymbolSearch />);

    await user.type(screen.getByRole("combobox", { name: "Hisse ara" }), "ZZ");

    expect(await screen.findByText("Sonuç bulunamadı.")).toBeInTheDocument();
  });

  it("istek hatasında hata mesajı gösterir ve çökmez", async () => {
    installFetch(() => {
      throw new Error("network");
    });
    const user = userEvent.setup();
    renderWithIntl(<SymbolSearch />);

    // Modül düzeyi önbellek testler arası paylaşıldığından benzersiz sorgu.
    await user.type(screen.getByRole("combobox", { name: "Hisse ara" }), "ERRQ");

    expect(await screen.findByText("Arama başarısız oldu. Lütfen tekrar dene.")).toBeInTheDocument();
  });

  it("aynı sorgu ikinci kez yazılınca önbellekten gelir (ek istek yok)", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SymbolSearch />);

    await user.type(screen.getByRole("combobox", { name: "Hisse ara" }), "CACHE");
    await screen.findByRole("option", { name: /ASELS/ });
    const afterFirst = searchPaths().length;

    await user.clear(screen.getByRole("combobox", { name: "Hisse ara" }));
    await user.type(screen.getByRole("combobox", { name: "Hisse ara" }), "CACHE");

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /ASELS/ })).toBeInTheDocument();
    });
    expect(searchPaths().length).toBe(afterFirst);
  });
});
