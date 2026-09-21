import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "../badge";
import { Skeleton } from "../skeleton";

describe("Badge", () => {
  it("varyant sınıfları token utility'si içerir, keyfi renk kullanmaz", () => {
    render(<Badge variant="positive">Yükseliş</Badge>);
    const badge = screen.getByText("Yükseliş");

    expect(badge).toHaveClass("bg-positive", "text-positive-foreground");
    expect(badge.className).not.toMatch(/\[#/);
  });

  it("nötr varyantta yüzey ve kenarlık token'larını kullanır", () => {
    render(<Badge>Beklemede</Badge>);
    const badge = screen.getByText("Beklemede");

    expect(badge).toHaveClass("border-border", "bg-surface-raised", "text-foreground");
  });
});

describe("Skeleton", () => {
  it("animate-pulse + bg-surface-raised ile render edilir ve gizlidir", () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveClass("animate-pulse", "bg-surface-raised");
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });
});
