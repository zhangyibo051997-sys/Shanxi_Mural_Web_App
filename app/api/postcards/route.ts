import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { FALLBACK_POSTCARDS } from "@/lib/postcards";

export const dynamic = "force-dynamic";

const IMAGE_EXTENSIONS = new Set([".png", ".webp", ".jpg", ".jpeg", ".svg"]);
const POSTCARDS_ROOT = path.join(process.cwd(), "public", "images", "postcards");

const TITLE_BY_ID = Object.fromEntries(
  FALLBACK_POSTCARDS.map((card) => [card.id, card.title])
);
const ORIENTATION_BY_ID = Object.fromEntries(
  FALLBACK_POSTCARDS.map((card) => [card.id, card.orientation ?? "landscape"])
) as Record<string, "landscape" | "portrait">;

export async function GET() {
  let entries;
  try {
    entries = await readdir(POSTCARDS_ROOT, { withFileTypes: true });
  } catch {
    return NextResponse.json({ postcards: FALLBACK_POSTCARDS });
  }

  const fromDisk = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        !entry.name.startsWith(".") &&
        IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    )
    .map((entry) => {
      const id = entry.name.replace(/\.[^.]+$/, "");
      return {
        id,
        fileName: entry.name,
        title: TITLE_BY_ID[id] ?? id.replace(/[_-]+/g, " · "),
        src: `/images/postcards/${encodeURIComponent(entry.name)}`,
        orientation: ORIENTATION_BY_ID[id] ?? "landscape",
      };
    });

  // 保持 FALLBACK 顺序，便于随机池稳定；缺失文件时跳过
  const byId = new Map(fromDisk.map((card) => [card.id, card]));
  const ordered = FALLBACK_POSTCARDS.map((card) => byId.get(card.id)).filter(
    (card): card is NonNullable<typeof card> => Boolean(card)
  );
  const extras = fromDisk.filter(
    (card) => !FALLBACK_POSTCARDS.some((known) => known.id === card.id)
  );

  return NextResponse.json({
    postcards: ordered.length ? [...ordered, ...extras] : fromDisk,
  });
}
