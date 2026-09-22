#!/usr/bin/env bash
#
# PWA / uygulama ikonlarını `src/app/icon.svg`'ten üretir (Faz 6 / Birim 6.4).
#
# Tekrarlanabilirlik: kaynak tek dosyadır (`src/app/icon.svg`); bu betik ondan
# dört raster türetir. Üretilen PNG'ler repoya girer (build sırasında çağrılmaz).
# Gereksinimler: `rsvg-convert` (librsvg) ve `magick` (ImageMagick 7).
#
# Kullanım:  bash scripts/generate-icons.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE="$ROOT/src/app/icon.svg"
PUBLIC_DIR="$ROOT/public"
APP_DIR="$ROOT/src/app"

# Koyu tema arka planı (`src/i18n/config.ts` themeColors.dark ile aynı token).
BACKGROUND="#0b0e14"

for tool in rsvg-convert magick; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "[icons] eksik araç: $tool" >&2
    exit 1
  fi
done

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$PUBLIC_DIR"

# 1) Normal ikonlar: marka işareti (köşeleri yuvarlak, saydam zemin korunur).
rsvg-convert -w 192 -h 192 "$SOURCE" -o "$PUBLIC_DIR/pwa-192.png"
rsvg-convert -w 512 -h 512 "$SOURCE" -o "$PUBLIC_DIR/pwa-512.png"

# 2) Maskable: tam kanama arka plan; işaret güvenli alana (%80) sığdırılır.
#    W3C maskable rehberi: ana içerik, ikonun %80 çapındaki dairenin içinde kalmalı.
rsvg-convert -w 410 -h 410 "$SOURCE" -o "$TMP_DIR/mark-410.png"
magick "$TMP_DIR/mark-410.png" -gravity center -background "$BACKGROUND" -extent 512x512 \
  "$PUBLIC_DIR/pwa-maskable-512.png"

# 3) Apple touch icon: 180×180, opak (iOS saydam köşeleri siyaha çevirir).
rsvg-convert -w 180 -h 180 "$SOURCE" -o "$TMP_DIR/mark-180.png"
magick "$TMP_DIR/mark-180.png" -background "$BACKGROUND" -flatten "$APP_DIR/apple-icon.png"

echo "[icons] üretildi:"
for file in \
  "$PUBLIC_DIR/pwa-192.png" \
  "$PUBLIC_DIR/pwa-512.png" \
  "$PUBLIC_DIR/pwa-maskable-512.png" \
  "$APP_DIR/apple-icon.png"; do
  echo "  - ${file#"$ROOT/"}"
done
