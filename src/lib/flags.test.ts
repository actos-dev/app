/**
 * Feature flag testleri (S-26).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { isFlagEnabled, parseFlagList } from "@/lib/flags";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseFlagList", () => {
  it("virgüllü listeyi kırpar ve boşları atar", () => {
    expect(parseFlagList("a, b ,,c")).toEqual(["a", "b", "c"]);
    expect(parseFlagList("")).toEqual([]);
    expect(parseFlagList(undefined)).toEqual([]);
  });
});

describe("isFlagEnabled", () => {
  it("FLAGS listesinden okur", () => {
    vi.stubEnv("FLAGS", "envelope, new-auth");
    vi.stubEnv("NEXT_PUBLIC_FLAGS", "");
    expect(isFlagEnabled("envelope")).toBe(true);
    expect(isFlagEnabled("new-auth")).toBe(true);
    expect(isFlagEnabled("missing")).toBe(false);
  });

  it("NEXT_PUBLIC_FLAGS listesinden okur", () => {
    vi.stubEnv("FLAGS", "");
    vi.stubEnv("NEXT_PUBLIC_FLAGS", "beta");
    expect(isFlagEnabled("beta")).toBe(true);
    expect(isFlagEnabled("envelope")).toBe(false);
  });

  it("boş env'de hiçbir flag açık değildir", () => {
    vi.stubEnv("FLAGS", "");
    vi.stubEnv("NEXT_PUBLIC_FLAGS", "");
    expect(isFlagEnabled("any")).toBe(false);
    expect(isFlagEnabled("")).toBe(false);
  });
});
