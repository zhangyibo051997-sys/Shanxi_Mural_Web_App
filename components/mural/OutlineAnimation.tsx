"use client";

import { useEffect, useId, useRef } from "react";
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
  const clipId = useId();

  useEffect(() => {
    const node = outlineRef.current;
    if (!node || !active) return;

    const length =
      "getTotalLength" in node && typeof node.getTotalLength === "function"
        ? node.getTotalLength()
        : 2 * (width + height);

    if (reducedMotion) {
      gsap.set(node, { strokeDasharray: length, strokeDashoffset: 0, opacity: 1 });
      onCompleteRef.current?.();
      return;
    }

    const tween = gsap.fromTo(
      node,
      { strokeDasharray: length, strokeDashoffset: length, opacity: 1 },
      {
        strokeDashoffset: 0,
        duration: 0.7,
        ease: "power2.inOut",
        onComplete: () => onCompleteRef.current?.(),
      }
    );

    return () => {
      tween.kill();
    };
  }, [active, height, reducedMotion, width, path]);

  if (!active) return null;

  const pad = 5;

  return (
    <svg
      className="pointer-events-none absolute -left-[5px] -top-[5px] overflow-visible"
      width={width + pad * 2}
      height={height + pad * 2}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          {path ? (
            <path d={path} />
          ) : (
            <rect x={pad} y={pad} width={width} height={height} />
          )}
        </clipPath>
      </defs>
      {path ? (
        <path
          ref={outlineRef as React.RefObject<SVGPathElement>}
          d={path}
          fill="none"
          stroke="#A83826"
          strokeWidth="2"
          strokeLinecap="round"
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
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
