/**
 * Portföy query anahtarları (Faz 4 / Birim 4.1, P-03).
 *
 * Tek kök (`qk.portfolios()`) altında toplanma ve kimlik kanonikleştirmesi
 * doğrulanır; merkezî invalidation'ın tüm portföy sorgularını kapsadığı kanıtlanır.
 */
import { describe, expect, it } from "vitest";

import { qk } from "@/lib/query/keys";

describe("portföy query anahtarları", () => {
  it("portföy kökü ve alt anahtarları hiyerarşiktir", () => {
    expect(qk.portfolios()).toEqual(["florence", "portfolios"]);
    expect(qk.portfolioSummaries()).toEqual(["florence", "portfolios", "summaries"]);
    expect(qk.portfolioList()).toEqual(["florence", "portfolios", "list"]);
    expect(qk.portfolio("port-1")).toEqual(["florence", "portfolios", "detail", "port-1"]);
    expect(qk.portfolioValuation("port-1")).toEqual([
      "florence",
      "portfolios",
      "valuation",
      "port-1",
    ]);
    expect(qk.portfolioTransactions("port-1")).toEqual([
      "florence",
      "portfolios",
      "transactions",
      "port-1",
    ]);
  });

  it("kök invalidation tüm portföy anahtarlarını kapsar", () => {
    const root = qk.portfolios();
    const keys = [
      qk.portfolioSummaries(),
      qk.portfolioList(),
      qk.portfolio("port-1"),
      qk.portfolioValuation("port-1"),
      qk.portfolioTransactions("port-1"),
    ];
    for (const key of keys) {
      expect(key.slice(0, root.length)).toEqual(root);
    }
  });

  it("portföy kimliği kanonikleştirilir (trim)", () => {
    expect(qk.portfolio("  port-1  ")).toEqual(qk.portfolio("port-1"));
    expect(qk.portfolioValuation(" port-1")).toEqual(qk.portfolioValuation("port-1"));
  });
});
