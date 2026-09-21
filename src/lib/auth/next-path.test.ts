/**
 * `?next=` open-redirect savunması testleri (S-02).
 */
import { describe, expect, it } from "vitest";

import {
  buildLoginRedirect,
  DEFAULT_NEXT_PATH,
  sanitizeNextPath,
} from "@/lib/auth/session";

describe("sanitizeNextPath", () => {
  it("aynı-origin mutlak yolları korur", () => {
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath("/portfolio/42?tab=positions")).toBe("/portfolio/42?tab=positions");
  });

  it("protokol-relative ve mutlak URL'leri reddeder", () => {
    expect(sanitizeNextPath("//evil.com")).toBe(DEFAULT_NEXT_PATH);
    expect(sanitizeNextPath("http://evil.com")).toBe(DEFAULT_NEXT_PATH);
    expect(sanitizeNextPath("https://evil.com/x")).toBe(DEFAULT_NEXT_PATH);
  });

  it("ters eğik çizgi hilelerini reddeder", () => {
    expect(sanitizeNextPath("\\\\evil")).toBe(DEFAULT_NEXT_PATH);
    expect(sanitizeNextPath("/\\evil.com")).toBe(DEFAULT_NEXT_PATH);
    expect(sanitizeNextPath("/dashboard\\..\\login")).toBe(DEFAULT_NEXT_PATH);
  });

  it("boş/undefined değerde varsayılana döner", () => {
    expect(sanitizeNextPath("")).toBe(DEFAULT_NEXT_PATH);
    expect(sanitizeNextPath(null)).toBe(DEFAULT_NEXT_PATH);
    expect(sanitizeNextPath(undefined)).toBe(DEFAULT_NEXT_PATH);
  });
});

describe("buildLoginRedirect", () => {
  it("hedefi encode ederek login'e bağlar", () => {
    expect(buildLoginRedirect("/dashboard")).toBe("/login?next=%2Fdashboard");
    expect(buildLoginRedirect("/dashboard", "?tab=1")).toBe(
      "/login?next=%2Fdashboard%3Ftab%3D1",
    );
    expect(buildLoginRedirect("/dashboard", "tab=1")).toBe(
      "/login?next=%2Fdashboard%3Ftab%3D1",
    );
  });

  it("tehlikeli hedefi varsayılana düşürür", () => {
    expect(buildLoginRedirect("//evil.com")).toBe("/login?next=%2Fdashboard");
    expect(buildLoginRedirect("http://evil.com")).toBe("/login?next=%2Fdashboard");
  });
});
