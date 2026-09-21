/**
 * `/research/advisor` — yatırım danışmanı (Faz 5 / Birim 5A.2).
 *
 * İki uç da `POST`'tur (`/stocks/fit`, `/portfolio/profile`) ve girdi kullanıcı
 * formundan geldiğinden SSR ön yüklemesi yoktur; sayfa bir RSC kabuğudur ve
 * veri istemci adasında çekilir. Bakım durumu istemcide `GET /maintenance` ile
 * okunur; backend kapalıyken uç hata verse bile sayfa çökmez (boş liste).
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdvisorWorkspace } from "@/components/advisor/AdvisorWorkspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("advisor") };
}

export default function AdvisorPage() {
  return <AdvisorWorkspace />;
}
