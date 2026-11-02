import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { TAGLINE } from "@/lib/site";

export const alt = `GitHarvey: ${TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONTS = path.join(process.cwd(), "fonts");
// The same product flow as the landing banner, drawn with Catgirl System Font keys.
const SCENE = ["h", "g", "m", "w", "U"];

export default async function Image() {
  const [bold, regular, cats] = await Promise.all([
    readFile(path.join(FONTS, "camingocode/CamingoCode-Bold.ttf")),
    readFile(path.join(FONTS, "camingocode/CamingoCode-Regular.ttf")),
    readFile(path.join(FONTS, "catgirl-system-font/CatgirlSystemFont-Regular.otf")),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", background: "#ffffff", color: "#000000", padding: 64, borderBottom: "12px solid #0a5cff" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Camingo", fontWeight: 700, fontSize: 132 }}>
            GitHarvey<span style={{ color: "#0a5cff" }}>_</span>
          </div>
          <div style={{ fontFamily: "Camingo", fontSize: 40, color: "#4a4a4a", marginTop: 8 }}>
            {TAGLINE}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 40 }}>
          {SCENE.map((key, i) => (
            <div key={key} style={{ display: "flex", alignItems: "flex-end", gap: 40 }}>
              <div style={{ fontFamily: "Catgirl", fontSize: 150, lineHeight: 1 }}>{key}</div>
              {i < SCENE.length - 1 && <div style={{ fontFamily: "Camingo", fontSize: 48, color: "#0a5cff", paddingBottom: 40 }}>→</div>}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Camingo", data: bold, weight: 700, style: "normal" },
        { name: "Camingo", data: regular, weight: 400, style: "normal" },
        { name: "Catgirl", data: cats, weight: 400, style: "normal" },
      ],
    },
  );
}
