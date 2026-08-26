import { useCallback, useSyncExternalStore } from "react";
import { isPostcardBackTemplate } from "@/lib/postcards";

export type CollectedPostcard = {
  id: string;
  src: string;
  title: string;
  collectedAt: string;
  orientation?: "landscape" | "portrait";
};

export type CollectedSticker = {
  id: string;
  src: string;
  title: string;
  fileName: string;
  collectedAt: string;
};

export type GameProgress = {
  stars: number;
  completedFigureIds: string[];
  collectedPostcards: CollectedPostcard[];
  collectedStickers: CollectedSticker[];
  updatedAt: string | null;
};

const STORAGE_KEY = "shanxi-mural-game-progress";
export const MAX_STARS = 3;

export const EMPTY_PROGRESS: GameProgress = {
  stars: 0,
  completedFigureIds: [],
  collectedPostcards: [],
  collectedStickers: [],
  updatedAt: null,
};

function clampStars(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_STARS, Math.max(0, Math.floor(value)));
}

/** 旧进度里可能误存了壁画 id；星星按人物/素材计，不按壁画去重。 */
function isMuralProgressId(id: string): boolean {
  return /^[a-z]+-m\d+$/i.test(id);
}

function withClampedStars(progress: GameProgress): GameProgress {
  const stars = clampStars(progress.stars);
  return stars === progress.stars ? progress : { ...progress, stars };
}

function parseCollectedPostcards(items: unknown): CollectedPostcard[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as { id?: unknown }).id !== "string" ||
      typeof (item as { src?: unknown }).src !== "string"
    ) {
      return [];
    }
    const record = item as Partial<CollectedPostcard>;
    const id = record.id as string;
    // Drop flip-back templates that were wrongly collected as fronts.
    if (isPostcardBackTemplate(id) || isPostcardBackTemplate(record.src ?? "")) {
      return [];
    }
    const orientation =
      record.orientation === "portrait" || record.orientation === "landscape"
        ? record.orientation
        : undefined;
    return [
      {
        id,
        src: record.src as string,
        title: typeof record.title === "string" ? record.title : id,
        collectedAt:
          typeof record.collectedAt === "string"
            ? record.collectedAt
            : new Date(0).toISOString(),
        orientation,
      },
    ];
  });
}

function parseCollectedStickers(items: unknown): CollectedSticker[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as { id?: unknown }).id !== "string" ||
      typeof (item as { src?: unknown }).src !== "string"
    ) {
      return [];
    }
    const record = item as Partial<CollectedSticker>;
    const src = record.src as string;
    return [
      {
        id: record.id as string,
        src,
        title: typeof record.title === "string" ? record.title : (record.id as string),
        fileName:
          typeof record.fileName === "string"
            ? record.fileName
            : decodeURIComponent(src.split("/").pop() ?? `${record.id}.png`),
        collectedAt:
          typeof record.collectedAt === "string"
            ? record.collectedAt
            : new Date(0).toISOString(),
      },
    ];
  });
}

function parseProgress(value: string | null): GameProgress {
  if (!value) return { ...EMPTY_PROGRESS };
  try {
    const parsed = JSON.parse(value) as Partial<GameProgress>;
    const completedFigureIds = Array.isArray(parsed.completedFigureIds)
      ? parsed.completedFigureIds.filter(
          (id): id is string => typeof id === "string"
        )
      : [];
    return {
      stars: clampStars(typeof parsed.stars === "number" ? parsed.stars : 0),
      completedFigureIds,
      collectedPostcards: parseCollectedPostcards(parsed.collectedPostcards),
      collectedStickers: parseCollectedStickers(parsed.collectedStickers),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

let snapshot: GameProgress = { ...EMPTY_PROGRESS };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(next: GameProgress) {
  snapshot = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const stored = withClampedStars(
    parseProgress(window.localStorage.getItem(STORAGE_KEY))
  );
  snapshot = {
    ...stored,
    stars: 0,
    completedFigureIds: [],
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function getGameProgress(): GameProgress {
  hydrate();
  snapshot = withClampedStars(snapshot);
  return snapshot;
}

export function addCollectedPostcard(postcard: CollectedPostcard): boolean {
  if (
    isPostcardBackTemplate(postcard.id) ||
    isPostcardBackTemplate(postcard.src)
  ) {
    return false;
  }
  const current = getGameProgress();
  if (current.collectedPostcards.some((item) => item.id === postcard.id)) {
    return false;
  }
  persist({
    ...current,
    collectedPostcards: [...current.collectedPostcards, postcard],
    updatedAt: new Date().toISOString(),
  });
  return true;
}

function getClientSnapshot(): GameProgress {
  if (!hydrated) return EMPTY_PROGRESS;
  snapshot = withClampedStars(snapshot);
  return snapshot;
}

function getServerSnapshot(): GameProgress {
  return EMPTY_PROGRESS;
}

export function subscribeGameProgress(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined" && !hydrated) {
    queueMicrotask(() => {
      hydrate();
      emit();
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = parseProgress(event.newValue);
    hydrated = true;
    emit();
  });
}

export function useGameProgress() {
  const progress = useSyncExternalStore(
    subscribeGameProgress,
    getClientSnapshot,
    getServerSnapshot
  );

  const awardFigure = useCallback(
    (figureId: string, aliases: string[] = []): boolean => {
      const current = getGameProgress();
      const keys = [figureId, ...aliases].filter(
        (id) => Boolean(id) && !isMuralProgressId(id)
      );
      if (keys.length === 0) return false;
      if (keys.some((id) => current.completedFigureIds.includes(id))) {
        return false;
      }
      persist({
        ...current,
        stars: clampStars(current.stars + 1),
        completedFigureIds: [...current.completedFigureIds, figureId],
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    []
  );

  const redeemPostcard = useCallback((postcard: CollectedPostcard) => {
    if (
      isPostcardBackTemplate(postcard.id) ||
      isPostcardBackTemplate(postcard.src)
    ) {
      return;
    }
    const current = getGameProgress();
    const alreadyCollected = current.collectedPostcards.some(
      (item) => item.id === postcard.id
    );
    persist({
      ...current,
      stars: 0,
      collectedPostcards: alreadyCollected
        ? current.collectedPostcards
        : [...current.collectedPostcards, postcard],
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const addCollectedPostcardToProgress = useCallback((postcard: CollectedPostcard) => {
    return addCollectedPostcard(postcard);
  }, []);

  const collectSticker = useCallback((sticker: CollectedSticker): boolean => {
    const current = getGameProgress();
    if (
      !sticker.src ||
      current.collectedStickers.some(
        (item) => item.id === sticker.id || item.src === sticker.src
      )
    ) {
      return false;
    }
    persist({
      ...current,
      collectedStickers: [...current.collectedStickers, sticker],
      updatedAt: new Date().toISOString(),
    });
    return true;
  }, []);

  const resetFigureAwards = useCallback(() => {
    const current = getGameProgress();
    if (current.completedFigureIds.length === 0) return;
    persist({
      ...current,
      completedFigureIds: [],
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const clearPostcards = useCallback(() => {
    const current = getGameProgress();
    persist({
      ...current,
      stars: 0,
      collectedPostcards: [],
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const clearStickers = useCallback(() => {
    const current = getGameProgress();
    persist({
      ...current,
      stars: 0,
      collectedStickers: [],
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const hasCompleted = useCallback(
    (figureId: string) => progress.completedFigureIds.includes(figureId),
    [progress.completedFigureIds]
  );

  return {
    progress,
    hydrated,
    awardFigure,
    resetFigureAwards,
    redeemPostcard,
    addCollectedPostcard: addCollectedPostcardToProgress,
    collectSticker,
    clearPostcards,
    clearStickers,
    hasCompleted,
  };
}
