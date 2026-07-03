import { ImageResponse } from "next/og";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export const runtime = "edge";
export const alt = `${APP_NAME} — ${APP_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #E60023 0%, #9B0030 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            📌
          </div>
          <div style={{ fontSize: 64, fontWeight: 800 }}>{APP_NAME}</div>
        </div>
        <div style={{ fontSize: 36, opacity: 0.95, maxWidth: 900, lineHeight: 1.3 }}>
          {APP_TAGLINE}
        </div>
      </div>
    ),
    { ...size }
  );
}
