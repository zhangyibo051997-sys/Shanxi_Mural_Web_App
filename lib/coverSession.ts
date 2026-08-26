import { coverElements, type CoverElement } from "@/data/coverElements";
import { assignCoverAssets, type CoverAsset } from "@/lib/coverAssets";

let assigned: CoverElement[] | null = null;
let pending: Promise<CoverElement[]> | null = null;
let cachedAssets: CoverAsset[] | null = null;

export function getAssignedCoverElements(): CoverElement[] | null {
  return assigned;
}

async function fetchCoverAssets(): Promise<CoverAsset[]> {
  if (cachedAssets) return cachedAssets;
  const response = await fetch("/data/cover-assets.json", {
    cache: "force-cache",
  });
  if (!response.ok) {
    throw new Error(`cover-assets ${response.status}`);
  }
  const data = (await response.json()) as { assets?: CoverAsset[] };
  cachedAssets = data.assets ?? [];
  return cachedAssets;
}

export async function loadCoverElements(): Promise<CoverElement[]> {
  if (assigned) return assigned;
  if (pending) return pending;

  pending = (async () => {
    try {
      const assets = await fetchCoverAssets();
      assigned = assignCoverAssets(assets);
    } catch {
      assigned = coverElements.map((slot) => ({
        ...slot,
        coverPosition: { ...slot.coverPosition },
        canvasPosition: { ...slot.canvasPosition },
        motion: { ...slot.motion },
        visibility: { ...slot.visibility },
      }));
    }
    pending = null;
    return assigned;
  })();

  return pending;
}

export async function reloadCoverElements(): Promise<CoverElement[]> {
  if (pending) await pending;
  pending = null;
  try {
    const assets = await fetchCoverAssets();
    assigned = assignCoverAssets(assets);
  } catch {
    assigned = coverElements.map((slot) => ({
      ...slot,
      coverPosition: { ...slot.coverPosition },
      canvasPosition: { ...slot.canvasPosition },
      motion: { ...slot.motion },
      visibility: { ...slot.visibility },
    }));
  }
  return assigned;
}
