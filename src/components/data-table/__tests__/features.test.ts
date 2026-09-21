import { describe, expect, it } from "vitest";

import { columnGridTrack, isColumnHidden } from "@/components/data-table/features";

describe("isColumnHidden", () => {
  it("hideBelow kırılımının altında gizler, üstünde gösterir", () => {
    const meta = { hideBelow: "md" as const };
    expect(isColumnHidden(meta, { sm: true, md: true, lg: true })).toBe(true);
    expect(isColumnHidden(meta, { sm: false, md: false, lg: true })).toBe(false);
  });

  it("kural yoksa her zaman görünür", () => {
    expect(isColumnHidden(undefined, { sm: true, md: true, lg: true })).toBe(false);
  });
});

describe("columnGridTrack", () => {
  it("genişlik verilmezse eşit pay kullanır", () => {
    expect(columnGridTrack(undefined)).toBe("minmax(0, 1fr)");
  });

  it("meta genişliğini kullanır", () => {
    expect(columnGridTrack({ width: "120px" })).toBe("120px");
  });
});
