/**
 * `/digest` sayfası render testleri (Faz 5 / Birim 5A.3, U-08, S-15).
 *
 * Sunucu yükleyicileri mock'lanır; güncel/bayat rozeti, boş gün, slot listesi
 * ve `date+slot` içerik görünümü doğrulanır.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Digest } from "@/lib/digest/types";
import { renderWithIntl } from "@/test/test-utils";

const loadMocks = vi.hoisted(() => ({
  loadCurrentDigest: vi.fn(),
  loadDigestArchive: vi.fn(),
  loadDigestBySlot: vi.fn(),
}));

vi.mock("@/lib/digest/load", () => loadMocks);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../../../../../messages/tr.json")).default as Record<string, unknown>;
  const resolve = (namespace: string | undefined, key: string): string => {
    const path = namespace ? `${namespace}.${key}` : key;
    let current: unknown = messages;
    for (const part of path.split(".")) {
      current =
        current !== null && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined;
    }
    return typeof current === "string" ? current : path;
  };
  return {
    getLocale: () => Promise.resolve("tr"),
    getTranslations: (namespace?: string) =>
      Promise.resolve((key: string, values?: Record<string, unknown>) => {
        const template = resolve(namespace, key);
        if (!values) {
          return template;
        }
        return template.replace(/\{(\w+)\}/g, (_, name: string) =>
          values[name] === undefined ? `{${name}}` : String(values[name]),
        );
      }),
  };
});

function digest(overrides: Partial<Digest> = {}): Digest {
  return {
    id: "d1",
    date: "2026-09-01",
    slot: "morning",
    title: "Sabah bülteni",
    content: "Özet",
    sections: [],
    metadata: {},
    language: "tr",
    created_at: "2026-09-01T07:00:00Z",
    ...overrides,
  };
}

type SearchParams = { date?: string; slot?: string };

async function renderPage(searchParams: SearchParams) {
  const { default: DigestPage } = await import("@/app/(app)/(public-market)/digest/page");
  const ui = await DigestPage({
    searchParams: Promise.resolve(searchParams),
  } as unknown as PageProps<"/digest">);
  return renderWithIntl(ui);
}

beforeEach(() => {
  loadMocks.loadCurrentDigest.mockReset();
  loadMocks.loadDigestArchive.mockReset();
  loadMocks.loadDigestBySlot.mockReset();
  loadMocks.loadCurrentDigest.mockResolvedValue({
    digest: digest({ id: "cur" }),
    freshness: "current",
    failed: false,
  });
  loadMocks.loadDigestArchive.mockResolvedValue({ status: "ok", digests: [] });
  loadMocks.loadDigestBySlot.mockResolvedValue({ status: "not-found", digest: null });
});

describe("/digest", () => {
  it("güncel bülteni 'Güncel' rozetiyle gösterir", async () => {
    await renderPage({ date: "2026-09-01" });

    expect(screen.getByText("Güncel")).toBeInTheDocument();
    expect(screen.getByText("Sabah bülteni")).toBeInTheDocument();
  });

  it("bayat bültende 'Güncel değil' rozetini ve açıklamayı gösterir", async () => {
    loadMocks.loadCurrentDigest.mockResolvedValue({
      digest: digest({ id: "old", date: "2026-08-30", slot: "evening" }),
      freshness: "stale",
      failed: false,
    });

    await renderPage({ date: "2026-09-01" });

    expect(screen.getByText("Güncel değil")).toBeInTheDocument();
    expect(
      screen.getByText("En son 30 Ağustos 2026 Akşam bülteni üretildi; daha yenisi yok."),
    ).toBeInTheDocument();
  });

  it("boş günde boş durum gösterir", async () => {
    await renderPage({ date: "2026-09-01" });

    expect(screen.getByText("Bu gün için bülten yok")).toBeInTheDocument();
  });

  it("o gün için mevcut slotları listeler", async () => {
    loadMocks.loadDigestArchive.mockResolvedValue({
      status: "ok",
      digests: [digest({ id: "m", slot: "morning" }), digest({ id: "e", slot: "evening" })],
    });

    await renderPage({ date: "2026-09-01" });

    expect(screen.getByText("Bu gün için mevcut bültenler")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sabah" })).toHaveAttribute(
      "href",
      "/digest?date=2026-09-01&slot=morning",
    );

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/digest?date=2026-09-01&slot=morning");
    expect(hrefs).toContain("/digest?date=2026-09-01&slot=evening");
    expect(hrefs).not.toContain("/digest?date=2026-09-01&slot=noon");
  });

  it("date+slot seçiliyse tek bülteni render eder", async () => {
    loadMocks.loadDigestArchive.mockResolvedValue({
      status: "ok",
      digests: [digest({ id: "m", slot: "morning" })],
    });
    loadMocks.loadDigestBySlot.mockResolvedValue({
      status: "ok",
      digest: digest({ id: "m", slot: "morning", title: "Seçili sabah bülteni" }),
    });

    await renderPage({ date: "2026-09-01", slot: "morning" });

    expect(screen.getByText("Seçili sabah bülteni")).toBeInTheDocument();
  });

  it("date+slot 404 ise slot boş durumunu gösterir", async () => {
    loadMocks.loadDigestBySlot.mockResolvedValue({ status: "not-found", digest: null });

    await renderPage({ date: "2026-09-01", slot: "morning" });

    expect(screen.getByText("Bu slotta bülten yok")).toBeInTheDocument();
  });
});
