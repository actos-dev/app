"use client";

/**
 * Hesap sekmesi (Faz 5 / Birim 5B.2, U-11).
 *
 * Üstte salt-okunur özet (kullanıcı adı, e-posta + doğrulama rozeti, kredi,
 * üyelik tarihi), altında kullanıcı adı / e-posta formları.
 * Özet verisi `useProfile` query'sinden (RSC ile tohumlanır) gelir; mutasyonlar
 * query önbelleğini güncellediğinden görüntü anında değişir.
 */
import { useTranslations } from "next-intl";

import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { useFormatters } from "@/lib/format";
import type { Profile } from "@/lib/profile/types";

import { EmailForm } from "./EmailForm";
import { UsernameForm } from "./UsernameForm";

type AccountTabProps = {
  profile: Profile;
};

const termClassName = "text-xs text-muted-foreground";
const detailClassName = "flex flex-wrap items-center gap-2 text-sm text-foreground";

export function AccountTab({ profile }: AccountTabProps) {
  const t = useTranslations("profile");
  const { formatDateTime, formatPrice } = useFormatters();
  const current = profile;

  return (
    <div className="flex flex-col gap-6">
      <Panel title={t("account.summaryTitle")}>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <dt className={termClassName}>{t("account.username")}</dt>
            <dd className="text-sm text-foreground">{current.username}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className={termClassName}>{t("account.email")}</dt>
            <dd className={detailClassName}>
              <span>{current.email}</span>
              <Badge variant={current.email_verified ? "positive" : "warning"}>
                {current.email_verified ? t("account.verified") : t("account.unverified")}
              </Badge>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className={termClassName}>{t("account.credits")}</dt>
            <dd className="font-mono text-sm text-foreground tabular-nums">
              {formatPrice(current.credits, { fractionDigits: 0 })}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className={termClassName}>{t("account.memberSince")}</dt>
            <dd className="text-sm text-foreground">{formatDateTime(current.created_at)}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title={t("account.changeUsername")}>
        <UsernameForm currentUsername={current.username} />
      </Panel>

      <Panel title={t("account.changeEmail")}>
        <EmailForm currentEmail={current.email} />
      </Panel>
    </div>
  );
}
