/**
 * Profil uçlarının tel formatı tipleri (Faz 5 / Birim 5B.2).
 *
 * NEDEN ELLE: Backend profil uçları `response_model` tanımlamadığından
 * `openapi.json` gövdeleri `unknown` üretir (bkz. `lib/reports/types.ts` ve
 * `lib/portfolio/types.ts` başındaki aynı gerekçe). Şekiller backend
 * kaynağından birebir çıkarıldı:
 *   - `GET /profile`       → `backend/src/api/auth.py::get_profile`
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
