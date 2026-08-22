"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CelebrationOverlayProps {
  active: boolean;
}

const COLORS = ["#A83826", "#B88C57", "#213338", "#D2CABC", "#B88C57"];

export default function CelebrationOverlay({ active }: CelebrationOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reducedMotion || !containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 36; i++) {
      const el = document.createElement("div");
      el.className = "pointer-events-none absolute rounded-full";
      el.style.width = `${4 + Math.random() * 6}px`;
      el.style.height = el.style.width;
      el.style.backgroundColor = COLORS[i % COLORS.length];
      el.style.left = `${20 + Math.random() * 60}%`;
      el.style.top = "40%";
      el.style.opacity = "0.85";
      container.appendChild(el);
      particles.push(el);
    }

    const ctx = gsap.context(() => {
      particles.forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 0, scale: 0, opacity: 0 },
          {
            y: -80 - Math.random() * 120,
            x: (Math.random() - 0.5) * 160,
            scale: 1,
            opacity: 0,
            duration: 1.2 + Math.random() * 0.6,
            delay: i * 0.03,
            ease: "power2.out",
          }
        );
      });
    }, container);

    return () => {
      ctx.revert();
      particles.forEach((el) => el.remove());
    };
  }, [active, reducedMotion]);

  if (!active || reducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      aria-hidden
    />
  );
}
