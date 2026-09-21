/**
 * PublicHeader testleri (Faz 2 / Birim 2.3a).
 *
 * İstemci bileşeni gerçek `tr` kataloğuyla render edilir; nav bağlantıları ile
 * giriş/kayıt hedefleri doğrulanır.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicHeader } from "@/components/marketing/PublicHeader";
import { renderWithIntl } from "@/test/test-utils";

describe("PublicHeader", () => {
  it("nav bağlantılarını doğru hedeflerle render eder", () => {
    renderWithIntl(<PublicHeader theme="dark" />);

    expect(screen.getByRole("link", { name: "Hakkında" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "İletişim" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: "İndir" })).toHaveAttribute("href", "/downloads");
  });

  it("giriş ve kayıt hedeflerini sunar", () => {
    renderWithIntl(<PublicHeader theme="dark" />);

    expect(screen.getByRole("link", { name: "Giriş" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Kayıt" })).toHaveAttribute("href", "/register");
  });
});
