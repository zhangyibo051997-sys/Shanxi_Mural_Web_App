import {
  FALLBACK_ARTWORK_PAIR,
  type ColoringArtworkPair,
} from "@/data/coloringArtworks";
import coloringManifest from "@/data/generated/coloring-artworks.json";

export async function listColoringArtworkPairs(): Promise<ColoringArtworkPair[]> {
  const pairs = coloringManifest.pairs as ColoringArtworkPair[];
  if (!pairs?.length) return [FALLBACK_ARTWORK_PAIR];
  return pairs;
}
