"use client";

import { useCallback } from "react";
import { templeAnchors } from "@/data/canvasLayout";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface MiniMapProps {
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  position: { x: number; y: number };
  onNavigate: (x: number, y: number) => void;
}

const MAP_W = 120;
const MAP_H = 80;

export default function MiniMap({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  position,
  onNavigate,
}: MiniMapProps) {
  const { t } = useLocale();
  const scaleX = MAP_W / canvasWidth;
  const scaleY = MAP_H / canvasHeight;

  const viewX = -position.x * scaleX;
  const viewY = -position.y * scaleY;
  const viewW = viewportWidth * scaleX;
  const viewH = viewportHeight * scaleY;

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * canvasWidth;
      const clickY = ((e.clientY - rect.top) / rect.height) * canvasHeight;
      onNavigate(clickX, clickY);
    },
    [canvasWidth, canvasHeight, onNavigate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNavigate(canvasWidth / 2, canvasHeight / 2);
      }
    },
    [canvasWidth, canvasHeight, onNavigate]
  );

  return (
    <div
      className="pointer-events-auto fixed bottom-5 right-5 z-40 hidden md:block md:bottom-6 md:right-6"
      role="img"
      aria-label={t("minimap.aria")}
    >
      <svg
        width={MAP_W}
        height={MAP_H}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="cursor-pointer rounded-sm border border-ink/10 bg-rice/70 backdrop-blur-sm"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label={t("minimap.click")}
      >
        {/* Temple dots */}
        {Object.entries(templeAnchors).map(([id, anchor]) => (
          <circle
            key={id}
            cx={anchor.x * scaleX}
            cy={anchor.y * scaleY}
            r={2}
            fill="#A83826"
            opacity={0.6}
          />
        ))}

        {/* Faint connections */}
        <line
          x1={templeAnchors.gongzhu.x * scaleX}
          y1={templeAnchors.gongzhu.y * scaleY}
          x2={templeAnchors.yanshan.x * scaleX}
          y2={templeAnchors.yanshan.y * scaleY}
          stroke="#213338"
          strokeWidth={0.3}
          opacity={0.15}
        />
        <line
          x1={templeAnchors.gongzhu.x * scaleX}
          y1={templeAnchors.gongzhu.y * scaleY}
          x2={templeAnchors.yongning.x * scaleX}
          y2={templeAnchors.yongning.y * scaleY}
          stroke="#213338"
          strokeWidth={0.3}
          opacity={0.15}
        />
        <line
          x1={templeAnchors.gongzhu.x * scaleX}
          y1={templeAnchors.gongzhu.y * scaleY}
          x2={templeAnchors.shuishen.x * scaleX}
          y2={templeAnchors.shuishen.y * scaleY}
          stroke="#213338"
          strokeWidth={0.3}
          opacity={0.15}
        />
        <line
          x1={templeAnchors.gongzhu.x * scaleX}
          y1={templeAnchors.gongzhu.y * scaleY}
          x2={templeAnchors.foguang.x * scaleX}
          y2={templeAnchors.foguang.y * scaleY}
          stroke="#213338"
          strokeWidth={0.3}
          opacity={0.15}
        />

        {/* Viewport rect */}
        <rect
          x={viewX}
          y={viewY}
          width={viewW}
          height={viewH}
          fill="none"
          stroke="#213338"
          strokeWidth={1}
          rx={1}
        />
      </svg>
    </div>
  );
}

/** 移动端简化位置指示器 */
export function MobilePositionIndicator({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  position,
}: {
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  position: { x: number; y: number };
}) {
  const maxX = Math.max(1, canvasWidth - viewportWidth);
  const maxY = Math.max(1, canvasHeight - viewportHeight);
  const progressX = (-position.x / maxX) * 100;
  const progressY = (-position.y / maxY) * 100;

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-40 md:hidden"
      aria-hidden="true"
    >
      <div className="relative h-10 w-10 rounded-full border border-ink/10 bg-rice/60">
        <div
          className="absolute h-2 w-2 rounded-full bg-cinnabar/70"
          style={{
            left: `${Math.min(85, Math.max(15, progressX))}%`,
            top: `${Math.min(85, Math.max(15, progressY))}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </div>
  );
}
