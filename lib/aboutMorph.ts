export const ABOUT_MORPH_OVERLAY_ID = "jin-about-morph-overlay";
export const ABOUT_BUTTON_RECT_KEY = "jin-about-button-rect";
export const ABOUT_RETURN_EXPAND_KEY = "jin-about-return-expand";

export type AboutMorphRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

let aboutReturnExpandPending = false;
let aboutReturnExpandActive = false;

/** Estimate the summary-tab about card frame in the viewport. */
export function getAboutCardTargetRect(): AboutMorphRect {
  const padX = window.innerWidth >= 768 ? 24 : 16;
  const padTop = window.innerWidth >= 768 ? 96 : 76;
  const padBottom = 24;
  const maxW = 672; // max-w-2xl
  const width = Math.min(maxW, window.innerWidth - padX * 2);
  const height = Math.min(
    window.innerHeight - padTop - padBottom,
    Math.max(420, window.innerHeight * 0.72)
  );
  return {
    width,
    height,
    left: (window.innerWidth - width) / 2,
    top: padTop + (window.innerHeight - padTop - padBottom - height) / 2,
  };
}

/** Fallback position for the cover "关于项目" pill. */
export function getAboutButtonFallbackRect(): AboutMorphRect {
  const width = 98;
  const height = 44;
  return {
    width,
    height,
    left: (window.innerWidth - width) / 2,
    top: window.innerHeight * 0.62,
  };
}

export function storeAboutButtonRect(rect: DOMRect | AboutMorphRect) {
  const payload: AboutMorphRect = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
  try {
    sessionStorage.setItem(ABOUT_BUTTON_RECT_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function takeAboutButtonRect(): AboutMorphRect | null {
  try {
    const raw = sessionStorage.getItem(ABOUT_BUTTON_RECT_KEY);
    sessionStorage.removeItem(ABOUT_BUTTON_RECT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AboutMorphRect;
  } catch {
    return null;
  }
}

export function peekAboutButtonRect(): AboutMorphRect | null {
  try {
    const raw = sessionStorage.getItem(ABOUT_BUTTON_RECT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AboutMorphRect;
  } catch {
    return null;
  }
}

export function markAboutReturnExpand() {
  aboutReturnExpandPending = true;
  try {
    sessionStorage.setItem(ABOUT_RETURN_EXPAND_KEY, "1");
  } catch {
    // ignore
  }
}

/** True if we should play expand-from-center; does not clear the flag. */
export function shouldAboutReturnExpand(): boolean {
  if (aboutReturnExpandPending) return true;
  try {
    if (sessionStorage.getItem(ABOUT_RETURN_EXPAND_KEY) === "1") {
      aboutReturnExpandPending = true;
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function isAboutReturnExpandActive(): boolean {
  return aboutReturnExpandActive;
}

export function beginAboutReturnExpand(): boolean {
  if (aboutReturnExpandActive) return false;
  if (!shouldAboutReturnExpand()) return false;
  aboutReturnExpandActive = true;
  return true;
}

export function clearAboutReturnExpand() {
  aboutReturnExpandPending = false;
  aboutReturnExpandActive = false;
  try {
    sessionStorage.removeItem(ABOUT_RETURN_EXPAND_KEY);
  } catch {
    // ignore
  }
}

export function removeAboutMorphOverlay() {
  document.getElementById(ABOUT_MORPH_OVERLAY_ID)?.remove();
}

export function createAboutMorphOverlay(from: AboutMorphRect): HTMLDivElement {
  removeAboutMorphOverlay();
  const overlay = document.createElement("div");
  overlay.id = ABOUT_MORPH_OVERLAY_ID;
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText = [
    "position:fixed",
    `top:${from.top}px`,
    `left:${from.left}px`,
    `width:${from.width}px`,
    `height:${from.height}px`,
    "border-radius:999px",
    "background:#e2ddd3",
    "border:1px solid rgb(33 51 56 / 12%)",
    "box-shadow:0 18px 40px rgb(33 51 56 / 18%)",
    "z-index:120",
    "pointer-events:none",
    "transform-origin:center center",
  ].join(";");
  document.body.appendChild(overlay);
  return overlay;
}
