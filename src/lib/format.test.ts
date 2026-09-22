import { createElement } from "react";
import { describe, expect, it } from "vitest";

import {
  EMPTY_VALUE,
  formatChangePercent,
  formatChangeValue,
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatPrice,
  formatTime,
  useFormatters,
} from "@/lib/format";
import { renderWithIntl } from "@/test/test-utils";

describe("formatPrice", () => {
  it("tr ve en ondalık/binlik ayraçlarını ayırır", () => {
    expect(formatPrice(1234.5, { locale: "tr" })).toBe("1.234,50");
    expect(formatPrice(1234.5, { locale: "en" })).toBe("1,234.50");
  });

  it("ondalık basamağı özelleştirir", () => {
    expect(formatPrice(42.1638, { locale: "tr", fractionDigits: 4 })).toBe("42,1638");
  });

  it("geçersiz değerde yer tutucu döner", () => {
    expect(formatPrice(null)).toBe(EMPTY_VALUE);
    expect(formatPrice(undefined)).toBe(EMPTY_VALUE);
    expect(formatPrice(Number.NaN)).toBe(EMPTY_VALUE);
  });
});

describe("formatChangeValue", () => {
  it("pozitif/negatif/sıfır işaretini doğru verir", () => {
    expect(formatChangeValue(2.41, { locale: "tr" })).toBe("+2,41");
    expect(formatChangeValue(-2.41, { locale: "tr" })).toBe("\u22122,41");
    expect(formatChangeValue(0, { locale: "tr" })).toBe("0,00");
  });

  it("yüzde biçiminde son ek getirir", () => {
    expect(formatChangePercent(2.41, { locale: "tr" })).toBe("+2,41%");
    expect(formatChangePercent(-1.18, { locale: "en" })).toBe("\u22121.18%");
    expect(formatChangePercent(null)).toBe(EMPTY_VALUE);
  });
});

describe("formatCompactNumber", () => {
  it("büyük sayıları kısaltır", () => {
    expect(formatCompactNumber(1_500_000, { locale: "en" })).toBe("1.5M");
    expect(formatCompactNumber(1_500_000, { locale: "tr" })).toContain("Mn");
  });

  it("geçersiz değerde yer tutucu döner", () => {
    expect(formatCompactNumber(undefined)).toBe(EMPTY_VALUE);
  });
});

describe("formatDateTime / formatTime", () => {
  it("Europe/Istanbul saat dilimini uygular", () => {
    expect(formatTime("2026-09-21T07:00:00Z", { locale: "tr" })).toBe("10:00");
    expect(formatDateTime("2026-09-21T07:00:00Z", { locale: "tr" })).toContain("10:00");
  });

  it("geçersiz tarihte yer tutucu döner", () => {
    expect(formatDateTime("not-a-date", { locale: "tr" })).toBe(EMPTY_VALUE);
    expect(formatTime(null)).toBe(EMPTY_VALUE);
  });
});

describe("formatDate", () => {
  it("yalnız günü uzun biçimde locale'e göre verir", () => {
    expect(formatDate("2026-07-22", { locale: "tr" })).toBe("22 Temmuz 2026");
    expect(formatDate("2026-07-22", { locale: "en" })).toBe("July 22, 2026");
  });

  it("geçersiz tarihte yer tutucu döner", () => {
    expect(formatDate("not-a-date", { locale: "tr" })).toBe(EMPTY_VALUE);
    expect(formatDate(null)).toBe(EMPTY_VALUE);
  });
});

describe("useFormatters", () => {
  it("aktif locale'i bağlar", () => {
    function Probe() {
      const { formatPrice } = useFormatters();
      return createElement("span", null, formatPrice(1234.5));
    }
    const { getByText } = renderWithIntl(createElement(Probe));
    expect(getByText("1.234,50")).toBeInTheDocument();
  });
});
