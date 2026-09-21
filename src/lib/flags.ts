/**
 * Basit env tabanlı feature flag'ler (plan S-26).
 *
 * Amaç: yeni akışları servis sağlayıcı değiştirmeden geri alabilmek. Değer
 * virgüllü liste (`FLAGS=envelope,new-auth`); boşluklar kırpılır, boş parçalar
 * atılır. Sunucu ve istemci uyumludur: istemci bundle'ına yalnız
 * `NEXT_PUBLIC_FLAGS` (build sırasında inline) girer; `FLAGS` yalnız sunucuda
 * anlamlıdır. Tarayıcıda `process.env.FLAGS` `undefined` olur, hata üretmez.
 */

/** `"a, b ,,c"` → `["a","b","c"]`. SAF; env okumaz. */
export function parseFlagList(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((flag) => flag.trim())
    .filter((flag) => flag.length > 0);
}

/**
 * `name` flag'i açık mı? `NEXT_PUBLIC_FLAGS` (istemci+sunucu) veya `FLAGS`
 * (yalnız sunucu) listelerinden birinde varsa `true`.
 */
export function isFlagEnabled(name: string): boolean {
  if (name.length === 0) {
    return false;
  }
  return (
    parseFlagList(process.env.NEXT_PUBLIC_FLAGS).includes(name) ||
    parseFlagList(process.env.FLAGS).includes(name)
  );
}
