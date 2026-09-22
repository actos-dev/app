/**
 * LazyMount testleri (D8).
 *
 * Görünüme girene dek `fallback` gösterilir; IntersectionObserver kesişme
 * bildirince içerik mount edilir ve gözlemci bırakılır. jsdom'da gözlemci
 * bulunmadığından içerik mount edilmez.
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LazyMount } from "@/components/market/LazyMount";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LazyMount", () => {
  it("IntersectionObserver yokken fallback gösterir", () => {
    render(
      <LazyMount fallback={<span>iskelet</span>}>
        <span>içerik</span>
      </LazyMount>,
    );

    expect(screen.getByText("iskelet")).toBeInTheDocument();
    expect(screen.queryByText("içerik")).not.toBeInTheDocument();
  });

  it("görünüme girince içeriği mount eder ve gözlemciyi bırakır", () => {
    let trigger: IntersectionObserverCallback = () => {};
    const observe = vi.fn();
    const disconnect = vi.fn();
    class MockObserver {
      constructor(callback: IntersectionObserverCallback) {
        trigger = callback;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", MockObserver);

    render(
      <LazyMount fallback={<span>iskelet</span>}>
        <span>içerik</span>
      </LazyMount>,
    );

    expect(observe).toHaveBeenCalled();
    expect(screen.queryByText("içerik")).not.toBeInTheDocument();

    act(() => {
      trigger(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(screen.getByText("içerik")).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  });
});
