/**
 * Paylaşım görseli (plan M-07, Faz 2).
 *
 * `next/og` `ImageResponse` ile marka renkli, sade bir OG görseli üretilir.
 * Dış font YOKTUR (sistem fontu); raster varlık da kullanılmaz. Renkler token
 * değerlerinin sabit kopyasıdır — `ImageResponse` Tailwind değişkenlerini
 * okuyamadığı için burada kaçınılmazdır.
 */
import { ImageResponse } from "next/og";

export const alt = "Florence — BIST piyasa takibi ve sanal portföy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0e14",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: "#5b9dff",
              color: "#0b0e14",
              fontSize: "44px",
              fontWeight: 700,
            }}
          >
            F
          </div>
          <div style={{ display: "flex", fontSize: "40px", fontWeight: 600, color: "#e8ecf4" }}>
            Florence
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#e8ecf4",
            }}
          >
            BIST piyasa takibi ve sanal portföy
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#9aa7bd" }}>
            Canlı veri · komisyonlu paper trading · AI raporları · Monte-Carlo
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
