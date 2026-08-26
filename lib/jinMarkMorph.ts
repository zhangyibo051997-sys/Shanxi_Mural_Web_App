"use client";

import { gsap } from "gsap";

/** Brand ink / vermiglio — match CSS tokens */
export const JIN_INK = "#213338";
export const JIN_VERMIGLIO = "#A83826";

/**
 * Lower half of Jin_logo.png (4500²), normalized.
 * Outer ≈ 339×177; stroke ≈ 38.2; red bar centered; gap on top-right.
 */
const VB_W = 339;
const VB_H = 177;
const STROKE = 38.2;
const LEFT_CX = 19.1;
const RIGHT_CX = 319.9;
const TOP_CY = 19.1;
const BOT_CY = 157.9;
const GAP_END_X = 269.4;

const RED_X = 70.2;
const RED_Y = 70.2;
const RED_W = 198.8;
const RED_H = 37.6;

/** Corner radius in viewBox units — softens the thick frame to match the pill. */
const CORNER_R = 18;

export const JIN_RED_FRAME = {
  x: RED_X / VB_W,
  y: RED_Y / VB_H,
  w: RED_W / VB_W,
  h: RED_H / VB_H,
};

export const JIN_MORPH_OVERLAY_ID = "jin-mark-morph-overlay";

export type JinMarkMorphHandlers = {
  source: DOMRect;
  fadeChrome: (duration: number) => void;
  onDisperse: () => void;
  onComplete: () => void;
  reducedMotion?: boolean;
};

function removeOverlay() {
  document.getElementById(JIN_MORPH_OVERLAY_ID)?.remove();
}

/**
 * Thick open frame (logo mass): down → left → up → right, gap at top-right.
 * Corners use arcs so the heavy stroke reads rounded, not a hairline outline.
 */
function logoOpenFramePath() {
  const r = Math.min(
    CORNER_R,
    (RIGHT_CX - LEFT_CX) / 2,
    (BOT_CY - TOP_CY) / 2
  );
  const gapEnd = Math.max(LEFT_CX + r + 4, GAP_END_X);

  return [
    `M ${RIGHT_CX} ${TOP_CY + r}`,
    `L ${RIGHT_CX} ${BOT_CY - r}`,
    `A ${r} ${r} 0 0 1 ${RIGHT_CX - r} ${BOT_CY}`,
    `L ${LEFT_CX + r} ${BOT_CY}`,
    `A ${r} ${r} 0 0 1 ${LEFT_CX} ${BOT_CY - r}`,
    `L ${LEFT_CX} ${TOP_CY + r}`,
    `A ${r} ${r} 0 0 1 ${LEFT_CX + r} ${TOP_CY}`,
    `L ${gapEnd} ${TOP_CY}`,
  ].join(" ");
}

/**
 * Brand transition: CTA pill → thick rounded logo frame draws around it →
 * hold → fade out in place → canvas opens.
 */
export function playJinMarkMorph({
  source,
  fadeChrome,
  onDisperse,
  onComplete,
  reducedMotion = false,
}: JinMarkMorphHandlers) {
  removeOverlay();

  if (reducedMotion) {
    fadeChrome(0.01);
    onDisperse();
    onComplete();
    return;
  }

  // Same scale as first version: outer mark sized so red bar ≈ CTA width.
  const markW = Math.max(300, Math.min(440, source.width / JIN_RED_FRAME.w));
  const markH = markW * (VB_H / VB_W);
  const centerX = source.left + source.width / 2;
  const centerY = source.top + source.height / 2;
  const markLeft = centerX - markW / 2;
  const markTop = centerY - markH / 2;

  const finalBar = {
    width: markW * JIN_RED_FRAME.w,
    height: markH * JIN_RED_FRAME.h,
    left: markW * JIN_RED_FRAME.x,
    top: markH * JIN_RED_FRAME.y,
  };

  const root = document.createElement("div");
  root.id = JIN_MORPH_OVERLAY_ID;
  root.setAttribute("aria-hidden", "true");
  root.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:130",
    "pointer-events:none",
  ].join(";");

  const mark = document.createElement("div");
  mark.style.cssText = [
    "position:absolute",
    `left:${markLeft}px`,
    `top:${markTop}px`,
    `width:${markW}px`,
    `height:${markH}px`,
    "transform-origin:center center",
  ].join(";");

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${VB_W} ${VB_H}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.cssText =
    "position:absolute;inset:0;display:block;overflow:visible;";

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", logoOpenFramePath());
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", JIN_INK);
  path.setAttribute("stroke-width", String(STROKE));
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);

  // Bar starts as the CTA pill (viewport coords → mark-local), stays a capsule.
  const bar = document.createElement("div");
  bar.style.cssText = [
    "position:absolute",
    `left:${source.left - markLeft}px`,
    `top:${source.top - markTop}px`,
    `width:${source.width}px`,
    `height:${source.height}px`,
    `background:${JIN_VERMIGLIO}`,
    "border-radius:999px",
    "transform-origin:center center",
  ].join(";");

  mark.appendChild(svg);
  mark.appendChild(bar);
  root.appendChild(mark);
  document.body.appendChild(root);

  // Lock geometry before measuring length so dash math matches final layout.
  const length = path.getTotalLength();
  gsap.set(path, {
    strokeDasharray: length,
    strokeDashoffset: length,
  });

  const timeline = gsap.timeline({
    onComplete: () => {
      removeOverlay();
      onComplete();
    },
  });

  timeline.call(() => fadeChrome(0.35), [], 0);

  // Morph pill into logo red bar slot — keep capsule radius (not a square).
  timeline.to(
    bar,
    {
      left: finalBar.left,
      top: finalBar.top,
      width: finalBar.width,
      height: finalBar.height,
      borderRadius: 999,
      duration: 0.46,
      ease: "power2.inOut",
    },
    0.16
  );

  // Thick frame draws in place (mark never translates).
  timeline.to(
    path,
    {
      strokeDashoffset: 0,
      duration: 0.82,
      ease: "power2.inOut",
    },
    0.58
  );

  const fadeAt = 0.58 + 0.82 + 0.28;

  timeline.to(
    mark,
    {
      opacity: 0,
      duration: 0.42,
      ease: "power2.inOut",
      onStart: () => {
        onDisperse();
      },
    },
    fadeAt
  );
}
