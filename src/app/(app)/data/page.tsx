/**
 * `/data` — Veri Merkezi (Faz 5 / Birim 5B.3, S-24 bağlamı).
 *
 * Sunucu bileşeni: `GET /data/export` (çerez forward edilir) ilk talep
 * listesini RSC'de çeker; istemci çalışma alanı yeni talep oluşturma, durum
 * takibi ve indirmeyi yönetir. `GET /data/daily/{year}` bilinçli olarak
 * 410 Gone döndüğünden KULLANILMAZ; dışa aktarma Google Takeout tarzı akıştır.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DataCenterWorkspace } from "@/components/data/DataCenterWorkspace";
import { PageHeader } from "@/components/shared/PageHeader";
import { serverAuthApiFetch } from "@/lib/api/server-auth";
import { DATA_EXPORT_SERVER_PATH } from "@/lib/data-center/api-paths";
import type { ExportJob } from "@/lib/data-center/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("data") };
}

export default async function DataPage() {
  const [exports, t] = await Promise.all([
    serverAuthApiFetch<ExportJob[]>(DATA_EXPORT_SERVER_PATH),
    getTranslations("dataCenter"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DataCenterWorkspace initialExports={exports ?? []} />
    </div>
  );
}
