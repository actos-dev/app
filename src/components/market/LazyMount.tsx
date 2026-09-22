"use client";

/**
 * Görünür-olana-kadar-erteleyen sarmalayıcı (D8).
 *
 * Ağır istemci parçalarını (ör. grafik chunk'ı) yalnız kapsayıcı görünüm
 * alanına `rootMargin` kadar yaklaşınca mount eder; o ana dek `fallback`
 * gösterilir. Sunucuda ve ilk render'da daima `fallback` render edilir,
 * gözlemci `useEffect` içinde kurulur. `IntersectionObserver` yoksa içerik
 * mount edilmez ve `fallback` kalır; sarmalayıcı min-yüksekliği düzenin
 * zıplamasını önler.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type LazyMountProps = {
  children: ReactNode;
  fallback: ReactNode;
  /** Gözlemci kenar boşluğu; varsayılan "200px". */
  rootMargin?: string;
  className?: string;
};

export function LazyMount({
  children,
  fallback,
  rootMargin = "200px",
  className,
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={cn("min-h-80 md:min-h-96", className)}>
      {mounted ? children : fallback}
    </div>
  );
}
