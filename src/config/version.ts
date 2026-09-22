/**
 * Uygulama sürümü — tek kaynak kök `package.json::version` (Faz 6 / Birim 6.5).
 *
 * Sürüm, deploy zincirinin tamamında aynı string'dir: `package.json` →
 * `vX.Y.Z` tag'i → Docker imaj etiketi → `/api/health` yanıtı. Böylece bir
 * container'ın hangi sürümü çalıştırdığı sağlık kontrolünden okunabilir.
 *
 * Yalnız sunucu tarafında (route handler) içe alınır; istemci paketine
 * girmemesi için client bileşenlerinden import edilmez.
 */
import packageJson from "../../package.json";

/** `package.json` sürümü (ör. `0.1.0`). */
export const APP_VERSION: string = packageJson.version;
