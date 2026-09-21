/**
 * Public içerik sayfası testleri (Faz 2 / Birim 2.3b).
 *
 * Sayfalar sunucu bileşenidir; `serverApiFetch` mock'lanır ve gerçek `tr`
 * kataloğuyla render edilir. Backend kapalıyken (mock `null`) her sayfa sade
 * bir boş durum göstermelidir; bilinmeyen yasal slug `notFound()` atmalıdır.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AboutPage from "@/app/(public)/about/page";
import ContactPage from "@/app/(public)/contact/page";
import DownloadsPage from "@/app/(public)/downloads/page";
import LegalPage from "@/app/(public)/legal/[policy]/page";

const { serverApiFetchMock, readDownloadsManifestMock } = vi.hoisted(() => ({
  serverApiFetchMock: vi.fn(),
  readDownloadsManifestMock: vi.fn(),
}));

vi.mock("@/lib/api/server", () => ({ serverApiFetch: serverApiFetchMock }));

vi.mock("@/lib/downloads", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/downloads")>();
  return { ...actual, readDownloadsManifest: readDownloadsManifestMock };
});

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../messages/tr.json")).default as Record<string, unknown>;
  const resolve = (
    namespace: string | undefined,
    key: string,
    values?: Record<string, unknown>,
  ): string => {
    const path = namespace ? `${namespace}.${key}` : key;
    let current: unknown = messages;
    for (const part of path.split(".")) {
      current =
        current !== null && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined;
    }
    if (typeof current !== "string") {
      return path;
    }
    if (!values) {
      return current;
    }
    return current.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match,
    );
  };
  return {
    getLocale: () => Promise.resolve("tr"),
    getTranslations:
      (namespace?: string) =>
      (key: string, values?: Record<string, unknown>) =>
        resolve(namespace, key, values),
  };
});

beforeEach(() => {
  serverApiFetchMock.mockReset();
  readDownloadsManifestMock.mockReset();
});

describe("/about", () => {
  it("backend içeriğini paragraflar halinde render eder", async () => {
    serverApiFetchMock.mockResolvedValue({
      lang: "tr",
      content: "Birinci paragraf.\n\nİkinci paragraf.",
    });

    render(await AboutPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Hakkında" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Birinci paragraf.")).toBeInTheDocument();
    expect(screen.getByText("İkinci paragraf.")).toBeInTheDocument();
  });

  it("boş gövdede boş durum gösterir", async () => {
    serverApiFetchMock.mockResolvedValue(null);

    render(await AboutPage());

    expect(screen.getByText("İçerik yok")).toBeInTheDocument();
    expect(screen.getByText(/Hakkında metni şu an yüklenemiyor/)).toBeInTheDocument();
  });
});

describe("/contact", () => {
  it("e-posta ve GitHub kanallarını güvenli bağlantılarla render eder", async () => {
    serverApiFetchMock.mockResolvedValue({
      email: "support@florencex.com.tr",
      github: "https://github.com/project-florence",
    });

    render(await ContactPage());

    expect(screen.getByRole("link", { name: "support@florencex.com.tr" })).toHaveAttribute(
      "href",
      "mailto:support@florencex.com.tr",
    );
    const github = screen.getByRole("link", { name: "https://github.com/project-florence" });
    expect(github).toHaveAttribute("href", "https://github.com/project-florence");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("javascript: şemalı GitHub adresini çizmez", async () => {
    serverApiFetchMock.mockResolvedValue({ email: null, github: "javascript:alert(1)" });

    render(await ContactPage());

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("İletişim bilgisi yok")).toBeInTheDocument();
  });

  it("boş gövdede boş durum gösterir", async () => {
    serverApiFetchMock.mockResolvedValue(null);

    render(await ContactPage());

    expect(screen.getByText("İletişim bilgisi yok")).toBeInTheDocument();
  });
});

describe("/legal/[policy]", () => {
  it("geçerli slug için başlık, güncelleme ve içeriği render eder", async () => {
    serverApiFetchMock.mockResolvedValue({
      policy: "terms",
      lang: "tr",
      last_updated: "2026-07-22",
      content: "Kullanım Koşulları\n\nSon Güncelleme: 22 Temmuz 2026\n\n* Birinci madde\n* İkinci madde",
    });

    render(await LegalPage({ params: Promise.resolve({ policy: "terms" }), searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Kullanım Şartları" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Son güncelleme: 2026-07-22")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("Birinci madde")).toBeInTheDocument();
    expect(screen.getByText("İkinci madde")).toBeInTheDocument();
  });

  it("backend boş dönerse boş durum gösterir", async () => {
    serverApiFetchMock.mockResolvedValue(null);

    render(await LegalPage({ params: Promise.resolve({ policy: "privacy_policy" }), searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Metin yok")).toBeInTheDocument();
  });

  it("bilinmeyen slug'da notFound atar ve backend'e istek yapmaz", async () => {
    await expect(
      LegalPage({ params: Promise.resolve({ policy: "unknown-policy" }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(serverApiFetchMock).not.toHaveBeenCalled();
  });
});

describe("/downloads", () => {
  it("manifest yokken dondurulma notu ve boş durum gösterir", async () => {
    readDownloadsManifestMock.mockResolvedValue(null);

    render(await DownloadsPage());

    expect(screen.getByText(/Masaüstü istemci donduruldu/)).toBeInTheDocument();
    expect(screen.getByText("Şu an indirilebilir sürüm yok")).toBeInTheDocument();
  });

  it("manifest varsa sürümü ve dosyaları platformlara göre listeler", async () => {
    readDownloadsManifestMock.mockResolvedValue({
      version: "0.6.0",
      files: ["Florence_0.6.0_x64-setup.exe", "Florence_0.6.0_aarch64.dmg", "Florence_0.6.0_amd64.deb"],
    });

    render(await DownloadsPage());

    expect(screen.getByText("Sürüm 0.6.0")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Windows" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "macOS" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Linux" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Florence_0\.6\.0_x64-setup\.exe/ })).toHaveAttribute(
      "href",
      "/downloads/Florence_0.6.0_x64-setup.exe",
    );
  });
});
