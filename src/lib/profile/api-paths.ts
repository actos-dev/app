/**
 * Profil API yolları (Faz 5 / Birim 5B.2).
 *
 * Tüm yollar `src/types/generated.ts` (`paths`) anahtarıdır; bu yüzden literal
 * olarak yazılır ve hem istemci (`ApiPath`) hem sunucu (`ServerApiPath`)
 * çağrılarında doğrudan kullanılabilir. Elle yol yazmak derleme zamanında
 * yakalanır.
 */

/** `GET /profile` — oturum sahibi kullanıcının profili. */
export const PROFILE_PATH = "/api/v1/profile" as const;

/** `GET /meta/avatars` — seçilebilir avatar listesi (public). */
export const META_AVATARS_PATH = "/api/v1/meta/avatars" as const;

/** `PUT /profile/avatar` — avatar seçimi. */
export const AVATAR_PATH = "/api/v1/profile/avatar" as const;

/** `PUT /auth/change-username` — kullanıcı adı değişimi (mevcut şifre ister). */
export const CHANGE_USERNAME_PATH = "/api/v1/auth/change-username" as const;

/** `PUT /auth/change-email` — e-posta değişimi (mevcut şifre ister). */
export const CHANGE_EMAIL_PATH = "/api/v1/auth/change-email" as const;

/** `PUT /auth/change-password` — şifre değişimi. */
export const CHANGE_PASSWORD_PATH = "/api/v1/auth/change-password" as const;

/** `DELETE /auth/delete` — hesabı kalıcı olarak siler. */
export const DELETE_ACCOUNT_PATH = "/api/v1/auth/delete" as const;

/** `GET/PUT /user/preferences` — tema/dil tercihlerinin çapraz cihaz deposu (B-15). */
export const USER_PREFERENCES_PATH = "/api/v1/user/preferences" as const;
