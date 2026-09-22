/**
 * Çevrimdışı sayfası render testi (Faz 6 / Birim 6.4, plan M-12, S-11).
 *
 * Sunucu bileşeni gerçek `tr` kataloğuyla çözülür; istemci "Tekrar dene"
 * aksiyonu `NextIntlClientProvider` ile sarılır.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", async () => {
  const messages = (await import("../../messages/tr.json")).default as Record<string, unknown>;
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
    getTranslations: (namespace?: string) =>
      Promise.resolve((key: string) => resolve(namespace, key)),
  };
});

import OfflinePage from "@/app/offline/page";
import { renderWithIntl } from "@/test/test-utils";

describe("/offline (6.4)", () => {
  it("bağlantı yok mesajını ve aksiyonları gösterir", async () => {
    renderWithIntl(await OfflinePage());

    expect(screen.getByRole("heading", { level: 1, name: "Bağlantı yok" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tekrar dene" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ana sayfa" })).toHaveAttribute("href", "/");
  });
});
