"use client";

/**
 * Profil > Duyurular sekmesi — YALNIZ yönetici (Faz 5 / Birim 5B.3).
 *
 * Liste + oluştur/düzenle/sil. İstemci kapısı (`user_type === 'admin'`)
 * yalnızca UX içindir: gerçek yetki backend'de `_is_admin` ile uygulanır ve
 * yetkisiz istekte 403 `Admin access required` döner. Sekme admin olmayan
 * kullanıcıda hiç render edilmez (`ProfileWorkspace`).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Megaphone, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from "@/hooks/useAnnouncements";
import type { Announcement } from "@/lib/announcements/types";
import { useFormatters } from "@/lib/format";

export function AdminAnnouncementsTab() {
  const t = useTranslations("announcements.admin");
  const { formatDateTime } = useFormatters();
  const query = useAnnouncements();
  const [formTarget, setFormTarget] = useState<Announcement | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const announcements = query.data?.announcements ?? [];
  const formOpen = formTarget !== undefined;

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title={t("title")}
        actions={
          <Button type="button" onClick={() => setFormTarget(null)}>
            <Plus aria-hidden="true" className="size-4" />
            {t("create")}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("description")}</p>

          {query.isLoading ? (
            <p className="text-sm text-muted-foreground" role="status">
              {t("loading")}
            </p>
          ) : query.isError ? (
            <ErrorState
              title={t("errorTitle")}
              description={t("errorDescription")}
              retry={{ label: t("retry"), onRetry: () => void query.refetch() }}
            />
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={<Megaphone aria-hidden="true" className="size-5" />}
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {announcements.map((announcement) => (
                <li key={announcement.id} className="flex flex-col gap-2 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {announcement.title}
                        {announcement.is_unread ? (
                          <Badge variant="info">{t("unread")}</Badge>
                        ) : null}
                      </span>
                      <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {announcement.content}
                      </p>
                      <time
                        dateTime={announcement.created_at}
                        className="text-xs text-muted-foreground"
                      >
                        {formatDateTime(announcement.created_at)}
                      </time>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormTarget(announcement)}
                      >
                        {t("edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-negative"
                        onClick={() => setDeleteTarget(announcement)}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <AnnouncementFormDialog
        key={formTarget?.id ?? "create"}
        announcement={formOpen ? formTarget : undefined}
        onOpenChange={(open) => {
          if (!open) {
            setFormTarget(undefined);
          }
        }}
      />
      <AnnouncementDeleteDialog
        announcement={deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}

type AnnouncementFormDialogProps = {
  /** `null` = yeni duyuru; dolu nesne = düzenleme; `undefined` = kapalı. */
  announcement: Announcement | null | undefined;
  onOpenChange: (open: boolean) => void;
};

function AnnouncementFormDialog({ announcement, onOpenChange }: AnnouncementFormDialogProps) {
  const t = useTranslations("announcements.admin");
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const open = announcement !== undefined;
  const isEdit = announcement != null;

  const schema = z.object({
    title: z.string().trim().min(1, t("titleRequired")),
    content: z.string().trim().min(1, t("contentRequired")),
  });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: announcement?.title ?? "", content: announcement?.content ?? "" },
  });

  useEffect(() => {
    if (open) {
      reset({ title: announcement?.title ?? "", content: announcement?.content ?? "" });
    }
  }, [open, announcement, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (announcement) {
        await update.mutateAsync({ id: announcement.id, ...values });
      } else {
        await create.mutateAsync(values);
      }
      onOpenChange(false);
    } catch {
      // Hata toast'ı kancada gösterilir; diyalog açık kalır.
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("formTitleEdit") : t("formTitleCreate")}
      description={t("formDescription")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="announcement-form" loading={isSubmitting}>
            {t("submit")}
          </Button>
        </>
      }
    >
      <form id="announcement-form" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label={t("titleLabel")} error={errors.title?.message}>
          {(control) => <Input {...control} type="text" {...register("title")} />}
        </FormField>
        <FormField label={t("contentLabel")} error={errors.content?.message}>
          {(control) => <Textarea {...control} rows={4} {...register("content")} />}
        </FormField>
      </form>
    </Dialog>
  );
}

type AnnouncementDeleteDialogProps = {
  announcement: Announcement | null;
  onOpenChange: (open: boolean) => void;
};

function AnnouncementDeleteDialog({ announcement, onOpenChange }: AnnouncementDeleteDialogProps) {
  const t = useTranslations("announcements.admin");
  const remove = useDeleteAnnouncement();

  const confirm = async () => {
    if (!announcement) {
      return;
    }
    try {
      await remove.mutateAsync(announcement.id);
      onOpenChange(false);
    } catch {
      // Hata toast'ı kancada gösterilir.
    }
  };

  return (
    <Dialog
      open={announcement !== null}
      onOpenChange={onOpenChange}
      title={t("deleteTitle")}
      description={t("deleteDescription", { title: announcement?.title ?? "" })}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={remove.isPending}
            onClick={() => {
              void confirm();
            }}
          >
            {t("deleteConfirm")}
          </Button>
        </>
      }
    />
  );
}
