"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface OutlineAnimationProps {
  active: boolean;
  width: number;
  height: number;
  path?: string;
  reducedMotion: boolean;
  onComplete?: () => void;
}

export default function OutlineAnimation({
  active,
  width,
  height,
  path,
  reducedMotion,
  onComplete,
}: OutlineAnimationProps) {
  const outlineRef = useRef<SVGPathElement | SVGRectElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const node = outlineRef.current;
    if (!node || !active) return;

    const length =
      "getTotalLength" in node && typeof node.getTotalLength === "function"
        ? node.getTotalLength()
        : 2 * (width + height);

    if (reducedMotion) {
      gsap.set(node, { strokeDasharray: length, strokeDashoffset: 0 });
      onCompleteRef.current?.();
      return;
    }

    const tween = gsap.fromTo(
      node,
      { strokeDasharray: length, strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        duration: 1.15,
        ease: "power2.inOut",
        onComplete: () => onCompleteRef.current?.(),
      }
    );

    return () => {
      tween.kill();
    };
  }, [active, height, reducedMotion, width, path]);

  if (!active) return null;

  const pad = 8;

  return (
    <svg
      className="pointer-events-none absolute -left-2 -top-2 overflow-visible"
      width={width + pad * 2}
      height={height + pad * 2}
      shapeRendering="geometricPrecision"
      aria-hidden="true"
    >
      {path ? (
        <path
          ref={outlineRef as React.RefObject<SVGPathElement>}
          d={path}
          fill="none"
          stroke="#A83826"
          strokeWidth="4"
          strokeLinecap="square"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <rect
          ref={outlineRef as React.RefObject<SVGRectElement>}
          x={pad}
          y={pad}
          width={width}
          height={height}
          fill="none"
          stroke="#A83826"
          strokeWidth="4"
          strokeLinecap="square"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
