export type PostcardAsset = {
  id: string;
  src: string;
  title: string;
  fileName: string;
  /** 明信片画幅方向，用于弹层与列表布局；缺省按横向处理 */
  orientation?: "landscape" | "portrait";
};

/** 翻转背面模板，不可作为可收集正面入池 */
export function isPostcardBackTemplate(idOrFileName: string): boolean {
  const id = idOrFileName.replace(/\.[^.]+$/, "").toLowerCase();
  return id === "back-zh" || id === "back-en" || id.startsWith("back-");
}

function postcardFromFile(
  fileName: string,
  title: string,
  orientation: "landscape" | "portrait"
): PostcardAsset {
  return {
    id: fileName.replace(/\.[^.]+$/, ""),
    fileName,
    title,
    src: `/images/postcards/${encodeURIComponent(fileName)}`,
    orientation,
  };
}

/** 2 横 + 2 竖：公主寺横、水神堂横、多福寺竖、永安寺竖 */
export const FALLBACK_POSTCARDS: PostcardAsset[] = [
  postcardFromFile("公主寺_引路菩萨.png", "公主寺 · 引路菩萨", "landscape"),
  postcardFromFile("水神堂_龙王降雨图.png", "水神堂 · 龙王降雨图", "landscape"),
  postcardFromFile("多福寺_佛传故事.png", "多福寺 · 佛传故事", "portrait"),
  postcardFromFile("永安寺_撕面明王.png", "永安寺 · 撕面明王", "portrait"),
];

const ORIENTATION_BY_ID: Record<string, "landscape" | "portrait"> =
  Object.fromEntries(
    FALLBACK_POSTCARDS.map((card) => [
      card.id,
      card.orientation ?? "landscape",
    ])
  );

function orientationForFile(fileName: string): "landscape" | "portrait" {
  const id = fileName.replace(/\.[^.]+$/, "");
  return ORIENTATION_BY_ID[id] ?? "landscape";
}

export async function fetchPostcardAssets(): Promise<PostcardAsset[]> {
  try {
    const response = await fetch("/api/postcards", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as {
        postcards?: Array<
          Omit<PostcardAsset, "orientation"> & {
            orientation?: PostcardAsset["orientation"];
          }
        >;
      };
      if (data.postcards?.length) {
        return data.postcards
          .filter((item) => !isPostcardBackTemplate(item.id))
          .map((item) => ({
            ...item,
            orientation:
              item.orientation ?? orientationForFile(item.fileName),
          }));
      }
    }
  } catch {
    /* use fallback */
  }
  return FALLBACK_POSTCARDS;
}

export function pickRandomPostcard(
  postcards: PostcardAsset[],
  collectedIds: string[]
): PostcardAsset | null {
  const poolSource = postcards.length ? postcards : FALLBACK_POSTCARDS;
  const unused = poolSource.filter(
    (item) =>
      !isPostcardBackTemplate(item.id) && !collectedIds.includes(item.id)
  );
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)] ?? null;
}
