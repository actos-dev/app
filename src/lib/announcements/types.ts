/**
 * Duyuru uçlarının tel formatı tipleri (Faz 5 / Birim 5B.3).
 *
 * NEDEN ELLE: Backend duyuru uçları `response_model` tanımlamadığından
 * `openapi.json` gövdeleri `unknown` üretir (bkz. `lib/reports/types.ts`
 * başındaki aynı gerekçe). Şekiller backend kaynağından birebir çıkarıldı:
 *   - `GET  /announcements`      → `announcements.py::list_announcements`
 *   - `POST /announcements`      → `AnnouncementCreate {title, content}`
 *   - `PUT  /announcements/{id}` → `AnnouncementUpdate {title, content}`
 *   - `POST /announcements/read` → tüm duyuruları okundu işaretler
 *
 * `is_unread` sunucu tarafında kullanıcının son okuma zamanına göre hesaplanır
 * (`last_announcement_viewed_at`); istemci bunu yeniden türetmez.
 */

/** Tek duyuru (`GET /announcements` satırı). */
export type Announcement = {
  id: number;
  title: string;
  content: string;
  sent_by: number | null;
  created_at: string;
  updated_at: string;
  /** Kullanıcı en son okuduktan sonra mı yayınlandı? */
  is_unread: boolean;
};

/** `GET /announcements` yanıtı. */
export type AnnouncementListResponse = {
  announcements: Announcement[];
};

/** `POST/PUT /announcements` istek gövdesi (backend `AnnouncementCreate/Update`). */
export type AnnouncementInput = {
  title: string;
  content: string;
};

/** Liste içindeki okunmamış duyuru sayısı. */
export function countUnread(announcements: readonly Announcement[]): number {
  return announcements.filter((announcement) => announcement.is_unread).length;
}
