"use client";

/**
 * React Query sağlayıcısı (plan P-03).
 *
 * Her mount için tek istemci üretilir; böylece aynı sorgu tüm ağaçta paylaşılır
 * ve sunucu render'ları arasında durum sızmaz. `defaultOptions` merkezîdir
 * (`src/lib/query/client.ts`).
 */
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { createQueryClient } from "@/lib/query/client";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
