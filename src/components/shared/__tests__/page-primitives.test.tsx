/**
 * Sayfa primitifleri testleri (plan §3.4, A-04).
 *
 * Metinler i18n'den çağıran tarafından verildiği için bu bileşenler context'siz
 * render edilir; `next/link` bağlantıları gerçek `href` ile doğrulanır.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Link from "next/link";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";

describe("PageHeader", () => {
  it("başlığı h1 olarak ve actions slot'unu render eder", () => {
    render(
      <PageHeader
        title="Raporlar"
        description="AI raporları"
        actions={<button type="button">Yeni</button>}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Raporlar" })).toBeInTheDocument();
    expect(screen.getByText("AI raporları")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yeni" })).toBeInTheDocument();
  });

  it("geri bağlantısını etiketiyle gösterir", () => {
    render(<PageHeader title="Portföy" backHref="/portfolio" backLabel="Geri" />);

    expect(screen.getByRole("link", { name: "Geri" })).toHaveAttribute("href", "/portfolio");
  });
});

describe("Panel", () => {
  it("başlığı h2 olarak ve içeriği render eder", () => {
    render(
      <Panel title="Pozisyonlar">
        <p>İçerik</p>
      </Panel>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Pozisyonlar" })).toBeInTheDocument();
    expect(screen.getByText("İçerik")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("başlık, açıklama ve aksiyonu gösterir", () => {
    render(
      <EmptyState
        title="Kayıt yok"
        description="Henüz veri yok"
        action={<Link href="/markets">Piyasalara git</Link>}
      />,
    );

    expect(screen.getByText("Kayıt yok")).toBeInTheDocument();
    expect(screen.getByText("Henüz veri yok")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Piyasalara git" })).toHaveAttribute(
      "href",
      "/markets",
    );
  });
});

describe("ErrorState", () => {
  it("tekrar dene geri çağrısını tetikler", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Bir şeyler ters gitti"
        description="Veri yüklenemedi"
        retry={{ label: "Tekrar dene", onRetry }}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
