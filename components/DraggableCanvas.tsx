"use client";

import { useMemo, useRef } from "react";
import MuralCard from "./MuralCard";
import type { MuralCardData } from "@/data/muralCards";
import { canvasLayout } from "@/data/canvasLayout";
import { scaleAnchors } from "@/lib/canvasScale";

interface DraggableCanvasProps {
  cards: MuralCardData[];
  canvasWidth: number;
  canvasHeight: number;
  position: { x: number; y: number };
  isDragging: boolean;
  bind: () => Record<string, unknown>;
  onSelectCard: (cardId: string, element: HTMLElement) => void;
  selectedCardId: string | null;
  isDetailOpen: boolean;
  introVisible: boolean;
  parallaxOffset: { x: number; y: number };
  isMobile?: boolean;
  /** 仅展示与这些寺庙相关的连接线；单寺时通常为空 */
  activeTempleIds?: string[] | null;
  focusingId?: string | null;
  onOutlineComplete?: (cardId: string) => void;
  hasDraggedRef?: React.RefObject<boolean | null>;
}

export default function DraggableCanvas({
  cards,
  canvasWidth,
  canvasHeight,
  position,
  isDragging,
  bind,
  onSelectCard,
  selectedCardId,
  isDetailOpen,
  introVisible,
  parallaxOffset,
  isMobile = false,
  activeTempleIds = null,
  focusingId = null,
  onOutlineComplete,
  hasDraggedRef,
}: DraggableCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const anchors = useMemo(() => scaleAnchors(isMobile), [isMobile]);

  const connectionLines = useMemo(() => {
    const connections =
      activeTempleIds && activeTempleIds.length > 0
        ? canvasLayout.connections.filter(
            (c) =>
              activeTempleIds.includes(c.from) &&
              activeTempleIds.includes(c.to)
          )
        : canvasLayout.connections;

    return connections.map((conn, i) => {
      const from = anchors[conn.from];
      const to = anchors[conn.to];
      if (!from || !to) return null;
      return (
        <line
          key={`${conn.from}-${conn.to}-${i}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#213338"
          strokeWidth={0.5}
          opacity={0.08}
          strokeDasharray="6 8"
        />
      );
    });
  }, [anchors, activeTempleIds]);

  return (
    <div
      {...bind()}
      ref={canvasRef}
      onClickCapture={(e) => {
        if (hasDraggedRef?.current) {
          e.stopPropagation();
          e.preventDefault();
          hasDraggedRef.current = false;
        }
      }}
      className={`fixed inset-0 z-10 touch-none overflow-hidden ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ touchAction: "none" }}
    >
      <div
        className="absolute will-change-transform grid"
        id="grid"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
      >
        {/* Connection paths */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={canvasWidth}
          height={canvasHeight}
          aria-hidden="true"
        >
          {connectionLines}
        </svg>

        {/* Cards */}
        {cards.map((card) => (
          <MuralCard
            key={card.id}
            card={card}
            parallaxOffset={parallaxOffset}
            onSelect={onSelectCard}
            isSelected={selectedCardId === card.id}
            isDetailOpen={isDetailOpen}
            priority={card.priority === "high"}
            introVisible={introVisible}
            isDragging={isDragging}
            focusing={focusingId === card.id}
            muted={Boolean(
              (focusingId || selectedCardId) &&
                focusingId !== card.id &&
                selectedCardId !== card.id
            )}
            onOutlineComplete={onOutlineComplete}
          />
        ))}
      </div>
    </div>
  );
}
