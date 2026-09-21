"use client";

/**
 * Avatar seçici (Faz 5 / Birim 5B.2, A-01, A-03).
 *
 * Erişilebilir radyo grubu: `<fieldset>/<legend>` + native `input[type=radio]`.
 * Görsel radyo yerine geçtiği için her kutunun erişilebilir adı vardır
 * ("Avatar 1"); görsel `alt=""` ile dekoratiftir. Seçim yerel state'te tutulur,
 * "Avatarı kaydet" ile `PUT /profile/avatar` çağrılır ve query önbelleği
 * güncellenir.
 */
import { Check } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useUpdateAvatar } from "@/hooks/useProfile";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import type { AvatarOption } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

import { StatusMessage } from "./parts";

type AvatarPickerProps = {
  avatars: readonly AvatarOption[];
  currentAvatarId: string | null;
};

export function AvatarPicker({ avatars, currentAvatarId }: AvatarPickerProps) {
  const t = useTranslations("profile");
  const tError = useTranslations();
  const update = useUpdateAvatar();
  const [selected, setSelected] = useState<string | null>(
    currentAvatarId ?? avatars[0]?.id ?? null,
  );
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (selected === null) {
      return;
    }
    setSuccess(false);
    setError(null);
    try {
      await update.mutateAsync({ avatar_id: selected });
      setSuccess(true);
    } catch (caught) {
      setError(translateBackendError(caught instanceof ApiError ? caught.code : undefined));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t("avatar.label")}</legend>
        <p className="text-sm text-muted-foreground">{t("avatar.description")}</p>

        {avatars.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("avatar.empty")}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {avatars.map((option) => {
              const isSelected = selected === option.id;
              const label = option.id.replace("avatar-", "");
              return (
                <label
                  key={option.id}
                  className={cn(
                    "relative inline-flex size-14 cursor-pointer items-center justify-center rounded-full border border-border transition-colors duration-150 ease-out hover:border-primary focus-within:ring-2 focus-within:ring-focus-ring",
                    isSelected && "border-primary",
                  )}
                >
                  <input
                    type="radio"
                    name="avatar"
                    value={option.id}
                    checked={isSelected}
                    aria-label={t("avatar.option", { index: label })}
                    onChange={() => {
                      setSelected(option.id);
                      setSuccess(false);
                    }}
                    className="sr-only"
                  />
                  <Image
                    src={option.url}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                    className="size-12 rounded-full"
                  />
                  {isSelected ? (
                    <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check aria-hidden="true" className="size-3" />
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {error ? <StatusMessage kind="error">{tError(error)}</StatusMessage> : null}
      {success ? <StatusMessage kind="success">{t("avatar.success")}</StatusMessage> : null}

      <div className="flex justify-start">
        <Button
          type="button"
          loading={update.isPending}
          disabled={selected === null}
          onClick={() => {
            void onSave();
          }}
        >
          {t("avatar.save")}
        </Button>
      </div>
    </div>
  );
}
