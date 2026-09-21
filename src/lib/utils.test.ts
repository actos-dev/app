import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("düz string sınıfları birleştirir", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("koşullu ve yanlış değerleri eler", () => {
    expect(cn("flex", false && "hidden", undefined, null, "gap-2")).toBe("flex gap-2");
  });

  it("dizi ve nesne girdilerini kabul eder", () => {
    expect(cn(["flex", "gap-2"], { hidden: false, "items-center": true })).toBe(
      "flex gap-2 items-center",
    );
  });

  it("çakışan Tailwind sınıflarında son gelen kazanır", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", "text-base")).toBe("text-base");
    expect(cn("bg-surface p-2", "bg-raised")).toBe("p-2 bg-raised");
  });

  it("çakışmayan Tailwind sınıflarını korur", () => {
    expect(cn("px-2", "py-4", "text-sm")).toBe("px-2 py-4 text-sm");
  });
});
