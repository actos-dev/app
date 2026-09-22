/**
 * Telemetry olay taksonomisi (plan S-10, Faz 6).
 *
 * Sabitler tek kaynaktır: çağrı yerleri ve testler serbest string yazmaz.
 * Ürün hunisi kayıt → doğrulama → ilk favori → ilk portföy → ilk rapor →
 * al/sat sırasını izler; buna RUM (`web_vital`) ve hata olayı (`client_error`)
 * eşlik eder.
 *
 * Not: Olay adları backend `analytics_events.event_type` alanına gider;
 * burada İngilizce/snake_case tutulur (proje kuralı).
 */
export const TelemetryEvents = {
  pageView: "page_view",
  signupCompleted: "signup_completed",
  loginSuccess: "login_success",
  favoriteToggle: "favorite_toggle",
  portfolioCreated: "portfolio_created",
  tradeExecuted: "trade_executed",
  reportGenerated: "report_generated",
  simulationRun: "simulation_run",
  digestViewed: "digest_viewed",
  searchUsed: "search_used",
  consentUpdated: "consent_updated",
  clientError: "client_error",
  webVital: "web_vital",
} as const;

/** Taksonomideki olay adlarından biri. */
export type TelemetryEvent = (typeof TelemetryEvents)[keyof typeof TelemetryEvents];
