export type PostcardAsset = {
  id: string;
  src: string;
  title: string;
  fileName: string;
};

function postcardFromFile(fileName: string, title: string): PostcardAsset {
  return {
    id: fileName.replace(/\.[^.]+$/, ""),
    fileName,
    title,
    src: `/images/postcards/${encodeURIComponent(fileName)}`,
  };
}

export const FALLBACK_POSTCARDS: PostcardAsset[] = [
  postcardFromFile("水神堂_龙母出宫降雨图.svg", "水神堂 · 龙母出宫降雨图"),
  postcardFromFile("多福寺_佛传故事.svg", "多福寺 · 佛传故事"),
  postcardFromFile("永乐宫_朝元图.svg", "永乐宫 · 朝元图"),
  postcardFromFile("公主寺_引路菩萨.png", "公主寺 · 引路菩萨"),
];

export async function fetchPostcardAssets(): Promise<PostcardAsset[]> {
  try {
    const response = await fetch("/api/postcards", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { postcards?: PostcardAsset[] };
      if (data.postcards?.length) return data.postcards;
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
  const unused = poolSource.filter((item) => !collectedIds.includes(item.id));
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)] ?? null;
}
