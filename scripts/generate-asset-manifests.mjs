/**
 * Build-time scan of public/images → small JSON manifests.
 * Keeps SSR/Edge function packages from tracing large image trees via fs.
 */
import { readdir, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const OUT_DIR = path.join(ROOT, "data", "generated");
const PUBLIC_DATA = path.join(PUBLIC, "data");

const IMAGE_EXTENSIONS = new Set([".png", ".webp", ".jpg", ".jpeg", ".svg"]);

const FALLBACK_POSTCARDS = [
  {
    id: "公主寺_引路菩萨",
    fileName: "公主寺_引路菩萨.png",
    title: "公主寺 · 引路菩萨",
    orientation: "landscape",
  },
  {
    id: "水神堂_龙王降雨图",
    fileName: "水神堂_龙王降雨图.png",
    title: "水神堂 · 龙王降雨图",
    orientation: "landscape",
  },
  {
    id: "多福寺_佛传故事",
    fileName: "多福寺_佛传故事.png",
    title: "多福寺 · 佛传故事",
    orientation: "portrait",
  },
  {
    id: "永安寺_撕面明王",
    fileName: "永安寺_撕面明王.png",
    title: "永安寺 · 撕面明王",
    orientation: "portrait",
  },
];

function isPostcardBackTemplate(name) {
  const id = name.replace(/\.[^.]+$/, "").toLowerCase();
  return id === "back-zh" || id === "back-en" || id.startsWith("back-");
}

function stemFromFileName(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

async function listFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter(
      (entry) =>
        entry.isFile() &&
        !entry.name.startsWith(".") &&
        IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    );
  } catch {
    return [];
  }
}

async function collectAssets(directory, relativeDir = "") {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const assets = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const relativePath = relativeDir
      ? `${relativeDir}/${entry.name}`
      : entry.name;
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      assets.push(...(await collectAssets(fullPath, relativePath)));
      continue;
    }

    if (!IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const folder = relativeDir.split("/")[0] || "objects";
    const encoded = relativePath
      .split(/[/\\]/)
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const stem = entry.name.replace(/\.[^.]+$/, "");
    const parts = stem
      .split(/[_-]/)
      .map((part) => part.trim())
      .filter((part) => part && !/^\d+$/.test(part));

    assets.push({
      src: `/images/objects/${encoded}`,
      fileName: entry.name,
      folder,
      alt: parts[parts.length - 1] || stem,
    });
  }
  return assets;
}

async function buildPostcards() {
  const root = path.join(PUBLIC, "images", "postcards");
  const files = await listFiles(root);
  const titleById = Object.fromEntries(
    FALLBACK_POSTCARDS.map((card) => [card.id, card.title])
  );
  const orientationById = Object.fromEntries(
    FALLBACK_POSTCARDS.map((card) => [card.id, card.orientation])
  );

  const fromDisk = files
    .filter((entry) => !isPostcardBackTemplate(entry.name))
    .map((entry) => {
      const id = stemFromFileName(entry.name);
      return {
        id,
        fileName: entry.name,
        title: titleById[id] ?? id.replace(/[_-]+/g, " · "),
        src: `/images/postcards/${encodeURIComponent(entry.name)}`,
        orientation: orientationById[id] ?? "landscape",
      };
    });

  const byId = new Map(fromDisk.map((card) => [card.id, card]));
  const ordered = FALLBACK_POSTCARDS.map((card) => byId.get(card.id)).filter(
    Boolean
  );
  const extras = fromDisk.filter(
    (card) => !FALLBACK_POSTCARDS.some((known) => known.id === card.id)
  );

  const postcards = ordered.length ? [...ordered, ...extras] : fromDisk;
  return { postcards };
}

async function buildCoverAssets() {
  const assets = await collectAssets(
    path.join(PUBLIC, "images", "objects")
  );
  return { assets };
}

async function buildColoringArtworks() {
  const lineDir = path.join(PUBLIC, "images", "coloring", "masks", "line");
  const originalDir = path.join(
    PUBLIC,
    "images",
    "coloring",
    "masks",
    "original"
  );
  const [lineFiles, originalFiles] = await Promise.all([
    listFiles(lineDir),
    listFiles(originalDir),
  ]);

  const originalsByStem = new Map();
  for (const entry of originalFiles) {
    originalsByStem.set(stemFromFileName(entry.name), entry.name);
  }

  const pairs = [];
  const seen = new Set();
  for (const entry of lineFiles) {
    const id = stemFromFileName(entry.name);
    const originalFileName = originalsByStem.get(id);
    if (!originalFileName || seen.has(id)) continue;
    seen.add(id);
    pairs.push({
      id,
      lineFileName: entry.name,
      originalFileName,
      lineArtUrl: `/images/coloring/masks/line/${encodeURIComponent(entry.name)}`,
      originalUrl: `/images/coloring/masks/original/${encodeURIComponent(originalFileName)}`,
    });
  }

  if (pairs.length === 0) {
    pairs.push({
      id: "sanqing",
      lineFileName: "sanqing-line.jpg",
      originalFileName: "sanqing-original.jpg",
      lineArtUrl: "/images/coloring/masks/line/sanqing-line.jpg",
      originalUrl: "/images/coloring/masks/original/sanqing-original.jpg",
    });
  }

  return { pairs };
}

async function writeManifest(name, payload) {
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(path.join(OUT_DIR, name), json, "utf8");
  await writeFile(path.join(PUBLIC_DATA, name), json, "utf8");
  console.log(`wrote ${name} (${Buffer.byteLength(json)} bytes)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(PUBLIC_DATA, { recursive: true });

  await writeManifest("postcards.json", await buildPostcards());
  await writeManifest("cover-assets.json", await buildCoverAssets());
  await writeManifest("coloring-artworks.json", await buildColoringArtworks());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
