/**
 * React Query istemcisi (plan P-03, P-04).
 *
 * Sorgu davranışı tek yerde tanımlanır; bileşenler kendi `refetchInterval`
 * veya `staleTime`'ını yazmaz. Polling `usePollingInterval` ile merkezîdir.
 */
import { QueryClient } from "@tanstack/react-query";

/** Varsayılanları uygulanmış yeni bir `QueryClient` üretir. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Piyasa verisi 30 sn taze sayılır; altındaki tekrarlar önbellekten gelir.
        staleTime: 30_000,
        // Sunucu tarafı status önbelleği 60 sn olduğundan 5 dk GC yeterli.
        gcTime: 5 * 60_000,
        // Tek deneme: 429/ağ hatalarında gereksiz baskı üretmemek için (S-11).
        retry: 1,
        // Polling merkezî yönetilir; sekme odağına dönüşte ekstra istek yok.
        refetchOnWindowFocus: false,
      },
    },
  });
}
