/**
 * Backend hata kodu eşleme testleri (plan B-07).
 *
 * Sabit auth kodları, portföy/rapor düz İngilizce metinleri, Pydantic 422
 * dizisi ve bilinmeyen değerler doğrulanır.
 */
import { describe, expect, it } from "vitest";

import { translateBackendError } from "@/lib/backend-errors";

describe("translateBackendError", () => {
  it("auth sabit kodlarını eşler", () => {
    expect(translateBackendError("error_login_failed")).toBe("apiErrors.loginFailed");
    expect(translateBackendError("error_email_not_verified")).toBe("apiErrors.emailNotVerified");
    expect(translateBackendError("error_username_taken")).toBe("apiErrors.usernameTaken");
    expect(translateBackendError("error_email_taken")).toBe("apiErrors.emailTaken");
    expect(translateBackendError("error_invalid_password")).toBe(
      "apiErrors.currentPasswordIncorrect",
    );
    expect(translateBackendError("error_invalid_or_expired_token")).toBe("apiErrors.invalidToken");
  });

  it("backend düz İngilizce metinlerini eşler", () => {
    expect(translateBackendError("Invalid credentials")).toBe("apiErrors.loginFailed");
    expect(translateBackendError("Invalid or expired verification token")).toBe(
      "apiErrors.invalidVerificationToken",
    );
    expect(translateBackendError("Email already verified")).toBe("apiErrors.emailAlreadyVerified");
    expect(translateBackendError("Current password is incorrect")).toBe(
      "apiErrors.currentPasswordIncorrect",
    );
    expect(translateBackendError("Too many requests. Please slow down.")).toBe(
      "apiErrors.tooManyRequests",
    );
  });

  it("portföy ve rapor metinlerini eşler", () => {
    expect(translateBackendError("Market is closed")).toBe("apiErrors.marketClosed");
    expect(translateBackendError("Portfolio not found")).toBe("apiErrors.portfolioNotFound");
    expect(translateBackendError("insufficient credit")).toBe("apiErrors.insufficientCredit");
    expect(translateBackendError("Report not found.")).toBe("apiErrors.reportNotFound");
  });

  it("rapor sabit kodlarını eşler (B-07)", () => {
    expect(translateBackendError("error_insufficient_credit")).toBe("apiErrors.insufficientCredit");
    expect(translateBackendError("error_report_failed")).toBe("apiErrors.reportFailed");
    expect(translateBackendError("error_report_not_found")).toBe("apiErrors.reportNotFound");
    expect(translateBackendError("error_invalid_report_type")).toBe("apiErrors.invalidReportType");
    expect(translateBackendError("error_invalid_file_type")).toBe("apiErrors.invalidFileType");
    expect(translateBackendError("error_database")).toBe("apiErrors.database");
  });

  it("BFF ve doğrulama değerlerini eşler", () => {
    expect(translateBackendError("error_backend_unreachable")).toBe("apiErrors.backendUnreachable");
    expect(translateBackendError("error_csrf_origin_mismatch")).toBe("apiErrors.csrfRejected");
    expect(translateBackendError([{ msg: "field required" }])).toBe("apiErrors.validation");
  });

  it("bilinmeyen değerleri jeneriğe düşürür", () => {
    expect(translateBackendError("something_unexpected")).toBe("apiErrors.generic");
    expect(translateBackendError(undefined)).toBe("apiErrors.generic");
    expect(translateBackendError(42)).toBe("apiErrors.generic");
  });
});
