/**
 * İskelet sayfa testi (Faz 1 / Birim 1.4).
 *
 * Sayfa sunucu bileşenidir; testte doğrudan çağrılıp çözülür. `getTranslations`
 * anahtarları döndürecek şekilde mock'lanır (anahtar varlığı ayrıca
 * `i18n-keys.test.ts` ile doğrulanır).
 *
 * NOT: `/symbol/[symbol]` Faz 3 / Birim 3.3'te gerçek sayfaya dönüştü; testi
 * `src/app/(app)/symbol/[symbol]/__tests__/symbol-page.test.tsx` içinde.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/(app)/dashboard/page";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

describe("stub sayfalar", () => {
  it("/dashboard başlık ve EmptyState metnini render eder", async () => {
    render(await DashboardPage());

    expect(screen.getByRole("heading", { level: 1, name: "nav.dashboard" })).toBeInTheDocument();
    expect(screen.getByText("common.comingSoonTitle")).toBeInTheDocument();
    expect(screen.getByText("common.comingSoonDescription")).toBeInTheDocument();
  });
});
