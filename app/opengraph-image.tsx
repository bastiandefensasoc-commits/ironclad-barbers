import { ImageResponse } from "next/og";

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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1B1917",
        }}
      >
        <div style={{ fontSize: 72, color: "#F6F2EA", fontWeight: 700, letterSpacing: -1 }}>
          Ironclad Barbers
        </div>
        <div style={{ fontSize: 32, color: "#AD8A4E", marginTop: 20 }}>
          Classic Cuts &amp; Hot Towel Shaves — Austin, TX
        </div>
      </div>
    ),
    { ...size },
  );
}
