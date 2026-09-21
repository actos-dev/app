/**
 * Backend hata kodu → i18n anahtarı eşlemesi (plan §5-B B-07, U-04, K-01).
 *
 * Backend auth uç noktaları sabit kod string'leri döner
 * (ör. `error_login_failed`); portföy/rapor tarafının bir kısmı hâlâ düz
 * İngilizce metindir (ör. `"Market is closed"`). Her iki biçim de burada
 * `apiErrors.*` i18n anahtarlarına çevrilir. `translateBackendError`
 * yalnız anahtar döner; görünen metni çağıran `t(...)` üretir.
 *
 * Bilinmeyen kod jenerik anahtara düşer; ham backend metni asla ekrana basılmaz.
 */

/** Backend `detail` değeri → `apiErrors` namespace'indeki anahtar. */
const BACKEND_ERROR_KEYS: Readonly<Record<string, string>> = {
  // Auth — sabit kodlar (kullanıcıya gösterilenler).
  error_login_failed: "apiErrors.loginFailed",
  error_email_not_verified: "apiErrors.emailNotVerified",
  error_username_taken: "apiErrors.usernameTaken",
  error_email_taken: "apiErrors.emailTaken",
  error_invalid_or_expired_token: "apiErrors.invalidToken",
  error_bots_not_allowed: "apiErrors.botsNotAllowed",
  error_bot_limit_reached: "apiErrors.botLimitReached",

  // Auth — düz İngilizce metinler (backend henüz kodlaştırmadı).
  "Invalid credentials": "apiErrors.loginFailed",
  "Invalid or expired verification token": "apiErrors.invalidVerificationToken",
  "Invalid or expired refresh token": "apiErrors.sessionExpired",
  "Invalid or expired token": "apiErrors.sessionExpired",
  "User not found": "apiErrors.userNotFound",
  "Email already verified": "apiErrors.emailAlreadyVerified",
  "Current password is incorrect": "apiErrors.currentPasswordIncorrect",
  "Email already in use": "apiErrors.emailInUse",
  "Username already in use": "apiErrors.usernameInUse",
  "Too many requests. Please slow down.": "apiErrors.tooManyRequests",
  "Database error": "apiErrors.database",

  // Portföy — kodlaştırılmış sabit `detail` değerleri (B-07).
  error_market_closed: "apiErrors.marketClosed",
  error_portfolio_not_found: "apiErrors.portfolioNotFound",
  error_transaction_failed: "apiErrors.transactionFailed",
  error_transaction_not_found: "apiErrors.transactionNotFound",
  error_nothing_to_undo: "apiErrors.nothingToUndo",
  error_invalid_ticker: "apiErrors.invalidTicker",
  error_portfolio_create_failed: "apiErrors.generic",

  // Portföy — düz İngilizce metinler (backend geçiş dönemi).
  "Market is closed": "apiErrors.marketClosed",
  "Portfolio not found": "apiErrors.portfolioNotFound",
  "Transaction not found": "apiErrors.transactionNotFound",
  "Price not found": "apiErrors.priceNotFound",
  "No vector data available for given tickers": "apiErrors.noVectorData",
  "Could not add to favorites": "apiErrors.favoriteFailed",

  // Rapor / simülasyon / kredi.
  "insufficient credit": "apiErrors.insufficientCredit",
  "Report not found or you do not have permission to view it.": "apiErrors.reportNotFound",
  "Report not found.": "apiErrors.reportNotFound",
  "Simulation not found": "apiErrors.simulationNotFound",
  "Invalid target price": "apiErrors.invalidTargetPrice",
  "Invalid simulation parameters": "apiErrors.invalidSimulationParameters",

  // BFF / altyapı.
  error_backend_unreachable: "apiErrors.backendUnreachable",
  error_csrf_origin_mismatch: "apiErrors.csrfRejected",
  error_validation: "apiErrors.validation",
  error_unknown: "apiErrors.generic",
};

/**
 * Backend `detail` değerini i18n anahtarına çevirir.
 *
 * - Sabit kod / bilinen İngilizce metin → eşlenen anahtar,
 * - Pydantic 422 doğrulama dizisi         → `apiErrors.validation`,
 * - Bilinmeyen her şey                    → `apiErrors.generic`.
 */
export function translateBackendError(detail: unknown): string {
  if (typeof detail === "string") {
    const key = BACKEND_ERROR_KEYS[detail];
    return key ?? "apiErrors.generic";
  }
  if (Array.isArray(detail)) {
    return "apiErrors.validation";
  }
  return "apiErrors.generic";
}
