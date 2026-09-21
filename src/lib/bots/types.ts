/**
 * Bot uçlarının tel formatı tipleri (Faz 5 / Birim 5B.3).
 *
 * NEDEN ELLE: Backend bot uçları `response_model` tanımlamadığından
 * `openapi.json` gövdeleri `unknown` üretir (bkz. `lib/reports/types.ts` ve
 * `lib/profile/types.ts` başındaki aynı gerekçe). Şekiller backend
 * kaynağından birebir çıkarıldı:
 *   - `POST   /bots`      → `backend/src/api/bots.py::create_bot`
 *   - `GET    /bots`      → `backend/src/api/bots.py::list_bots`
 *   - `DELETE /bots/{id}` → `backend/src/api/bots.py::delete_bot`
 *
 * Backend şema yayınlayınca (`npm run gen:api` sonrası) bu tipler
 * `generated.ts` lehine daraltılmalıdır.
 */

/** `GET /bots` satırı. */
export type Bot = {
  id: number;
  username: string;
  /** `null` olabilir (eski kayıtlar); UI boş değeri zarifçe gösterir. */
  created_at: string | null;
  last_login: string | null;
};

/** `GET /bots` yanıtı. */
export type BotListResponse = {
  bots: Bot[];
};

/** `POST /bots` istek gövdesi (backend `BotCreate`). */
export type BotCreateInput = {
  username: string;
  /** Boş bırakılırsa backend güçlü bir şifre üretir. */
  password?: string;
};

/**
 * `POST /bots` yanıtı.
 *
 * `password` YALNIZCA oluşturma yanıtında döner; bir daha okunamaz
 * (`bots.py` docstring'i). UI bunu kullanıcıya tek seferlik gösterir.
 */
export type BotCreateResponse = {
  id: number;
  username: string;
  email: string;
  password: string;
};

/**
 * Kullanıcı başına en fazla bot sayısı (backend `MAX_BOTS_PER_USER = 5`).
 * UI limiti bilgilendirme amaçlı gösterir; gerçek kapı backend'dedir.
 */
export const MAX_BOTS_PER_USER = 5;
