/**
 * `/profile` — sekmeli profil (Faz 5 / Birim 5B.2, U-11, S-07, B-15).
 *
 * Sunucu bileşeni: `GET /profile` (çerez forward edilir) ve public
 * `GET /meta/avatars` PARALEL çekilir; tema çerezden çözülür. Veriler istemci
 * çalışma alanına geçirilir, böylece ilk boyamada ek istek olmaz. Hesap,
 * görünüm ve güvenlik sekmeleri istemci tarafındadır. Botlar, veri merkezi ve
 * duyurular bu birimin (5B.3) dışındadır.
 */
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { ProfileUnavailable } from "@/components/profile/ProfileUnavailable";
import { ProfileWorkspace } from "@/components/profile/ProfileWorkspace";
import { PageHeader } from "@/components/shared/PageHeader";
import { resolveTheme, THEME_COOKIE } from "@/i18n/config";
import { serverApiFetch } from "@/lib/api/server";
import { serverAuthApiFetch } from "@/lib/api/server-auth";
import { META_AVATARS_PATH, PROFILE_PATH } from "@/lib/profile/api-paths";
import type { AvatarOption, Profile } from "@/lib/profile/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("profile") };
}

export default async function ProfilePage() {
  const [profile, avatars, cookieStore, t] = await Promise.all([
    serverAuthApiFetch<Profile>(PROFILE_PATH),
    serverApiFetch<AvatarOption[]>(META_AVATARS_PATH),
    cookies(),
    getTranslations("profile"),
  ]);
  const theme = resolveTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {profile ? (
        <ProfileWorkspace profile={profile} avatars={avatars ?? []} theme={theme} />
      ) : (
        <ProfileUnavailable />
      )}
    </div>
  );
}
