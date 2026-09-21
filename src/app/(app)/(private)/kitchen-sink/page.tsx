/**
 * `/kitchen-sink` — bileşen ve token vitrini (Faz 1 / Birim 1.5, S-16).
 *
 * Sunucu sarmalayıcıdır: üretimde rota 404 döner (sidebar'da zaten yalnız
 * geliştirmede görünür). Vitrinin kendisi istemci bileşenidir
 * (`./showcase.tsx`) çünkü diyalog, sekme ve toast etkileşimi gerektirir.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { KitchenSinkShowcase } from "./showcase";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("kitchenSink") };
}

export default function KitchenSinkPage() {
  // `notFound()` ilk await'ten önce çağrılır; böylece yanıt gerçek 404 olur.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <KitchenSinkShowcase />;
}
