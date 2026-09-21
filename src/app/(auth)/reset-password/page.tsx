/**
 * `/reset-password` (plan Faz 2 / Birim 2.2b, U-01).
 *
 * Sunucu bileşeni yalnız `token` sorgu parametresini okur ve istemci
 * bileşenine geçirir. Token yoksa istemci ağ isteği atmadan geçersiz bağlantı
 * durumunu gösterir; bu yüzden SSR çıktısı her koşulda 200'dür.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetTitle") };
}

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const params = await searchParams;
  const token =
    typeof params.token === "string" && params.token.length > 0 ? params.token : null;

  return <ResetPasswordForm token={token} />;
}
