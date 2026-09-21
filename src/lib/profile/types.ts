/**
 * Profil uçlarının tel formatı tipleri (Faz 5 / Birim 5B.2).
 *
 * NEDEN ELLE: Backend profil/meta uçları `response_model` tanımlamadığından
 * `openapi.json` gövdeleri `unknown` üretir (bkz. `lib/reports/types.ts` ve
 * `lib/portfolio/types.ts` başındaki aynı gerekçe). Şekiller backend
 * kaynağından birebir çıkarıldı:
 *   - `GET /profile`       → `backend/src/api/auth.py::get_profile`
 *   - `GET /meta/avatars`  → `backend/src/api/meta.py::list_avatars`
 *
 * Backend şema yayınlayınca (`npm run gen:api` sonrası) bu tipler
 * `generated.ts` lehine daraltılmalıdır.
 */

/** `GET /profile` yanıtı (auth.py). */
export type Profile = {
  username: string;
  email: string;
  user_type: string;
  created_at: string | null;
  email_verified: boolean;
  avatar_id: string | null;
  credits: number;
};

/** `GET /meta/avatars` satırı; `url` frontend assets'ine (`/avatars/*.svg`) işaret eder. */
export type AvatarOption = {
  id: string;
  url: string;
};
