"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CoverElement } from "@/data/coverElements";
import {
  getConvergenceDelta,
  getCoverWidth,
  pickCoverCanvasPoint,
} from "@/data/coverElements";

export type ElementPose = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type Target = { id: string; el: HTMLElement };

interface UseCoverTransitionOptions {
  reducedMotion: boolean;
  getTargets: () => Target[];
  getCoverPose: (id: string) => ElementPose | null;
  getCanvasPose: (id: string) => ElementPose | null;
  getElement: (id: string) => CoverElement | undefined;
  getViewport: () => { width: number; height: number };
  getCanvasCenter: () => { x: number; y: number };
}

function getDriftNode(el: HTMLElement): HTMLElement {
  return (el.querySelector("[data-mural-drift]") as HTMLElement | null) ?? el;
}

export function useCoverTransition({
  reducedMotion,
  getTargets,
  getCoverPose,
  getCanvasPose,
  getElement,
  getViewport,
  getCanvasCenter,
}: UseCoverTransitionOptions) {
  const driftTweensRef = useRef<gsap.core.Animation[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const getTargetsRef = useRef(getTargets);
  getTargetsRef.current = getTargets;

  const killDrift = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    driftTweensRef.current.forEach((tween) => tween.kill());
    driftTweensRef.current = [];
    getTargetsRef.current().forEach(({ el }) => {
      const driftNode = getDriftNode(el);
      gsap.killTweensOf(el);
      gsap.killTweensOf(driftNode);
      gsap.set(driftNode, { x: 0, y: 0, rotation: 0 });
    });
  }, []);

  const convergeToCenter = useCallback(
    ({
      onComplete,
    }: {
      onComplete?: () => void;
    } = {}) => {
      killDrift();
      const targets = getTargets().filter(({ id }) => {
        const element = getElement(id);
        return element?.showOnCover !== false;
      });
      const center = getCanvasCenter();

      if (!targets.length || reducedMotion) {
        targets.forEach(({ el }) => {
          gsap.set(el, {
            x: center.x,
            y: center.y,
            opacity: 0.25,
          });
        });
        onComplete?.();
        return;
      }

      timelineRef.current?.kill();
      const timeline = gsap.timeline({ onComplete });
      timelineRef.current = timeline;

      targets.forEach(({ el }, index) => {
        const jitterX = ((index * 37) % 61) - 30;
        const jitterY = ((index * 53) % 71) - 35;
        timeline.to(
          el,
          {
            x: center.x + jitterX,
            y: center.y + jitterY,
            scale: Number(gsap.getProperty(el, "scale")) * 0.72,
            opacity: 0.22,
            duration: 0.42,
            ease: "power2.in",
          },
          index * 0.012
        );
      });
    },
    [getCanvasCenter, getElement, getTargets, killDrift, reducedMotion]
  );

  const expandFromCenter = useCallback(
    ({
      onComplete,
    }: {
      onComplete?: () => void;
    } = {}) => {
      killDrift();
      const targets = getTargets();
      const center = getCanvasCenter();
      const viewport = getViewport();
      const occupied: { x: number; y: number; width: number; height: number }[] =
        [];

      if (!targets.length) {
        onComplete?.();
        return;
      }

      const destinations = new Map<
        string,
        { x: number; y: number; scale: number; rotation: number }
      >();

      targets.forEach(({ id, el }) => {
        const element = getElement(id);
        const pose = getCoverPose(id);
        if (!pose || !element || element.showOnCover === false) {
          gsap.set(el, { opacity: 0 });
          return;
        }
        const width = getCoverWidth(element, viewport.width);
        const height = width / element.coverPosition.aspectRatio;
        const point =
          pickCoverCanvasPoint({ width, height }, occupied, viewport, center) ??
          pose;
        occupied.push({ x: point.x, y: point.y, width, height });
        destinations.set(id, {
          x: point.x,
          y: point.y,
          scale: pose.scale,
          rotation: pose.rotation,
        });
        gsap.set(el, {
          x: center.x,
          y: center.y,
          scale: pose.scale * 0.55,
          rotation: pose.rotation,
          opacity: 0.55,
          transformOrigin: "0 0",
        });
      });

      if (reducedMotion) {
        destinations.forEach((pose, id) => {
          const target = targets.find((item) => item.id === id);
          if (!target) return;
          gsap.set(target.el, {
            x: pose.x,
            y: pose.y,
            scale: pose.scale,
            rotation: pose.rotation,
            opacity: 1,
          });
        });
        onComplete?.();
        return;
      }

      timelineRef.current?.kill();
      const timeline = gsap.timeline({ onComplete });
      timelineRef.current = timeline;

      let index = 0;
      destinations.forEach((pose, id) => {
        const target = targets.find((item) => item.id === id);
        if (!target) return;
        timeline.to(
          target.el,
          {
            x: pose.x,
            y: pose.y,
            scale: pose.scale,
            rotation: pose.rotation,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
          },
          0.04 + index * 0.014
        );
        index += 1;
      });
    },
    [
      getCanvasCenter,
      getCoverPose,
      getElement,
      getTargets,
      getViewport,
      killDrift,
      reducedMotion,
    ]
  );

  const placeAtCover = useCallback(() => {
    const targets = getTargets();
    const viewport = getViewport();
    const canvasCenter = getCanvasCenter();
    const occupied: { x: number; y: number; width: number; height: number }[] = [];
    const order = [...targets];
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const current = order[i];
      order[i] = order[j] as (typeof order)[number];
      order[j] = current as (typeof order)[number];
    }

    order.forEach(({ id, el }) => {
      const element = getElement(id);
      if (element?.showOnCover === false) {
        const canvasPose = getCanvasPose(id);
        if (!canvasPose) return;
        gsap.set(el, {
          x: canvasPose.x,
          y: canvasPose.y,
          scale: canvasPose.scale,
          rotation: canvasPose.rotation,
          opacity: 0,
          transformOrigin: "0 0",
        });
        return;
      }

      const pose = getCoverPose(id);
      if (!pose || !element) return;
      const width = getCoverWidth(element, viewport.width);
      const height = width / element.coverPosition.aspectRatio;
      const randomPoint = pickCoverCanvasPoint(
        { width, height },
        occupied,
        viewport,
        canvasCenter
      );
      const x = randomPoint?.x ?? pose.x;
      const y = randomPoint?.y ?? pose.y;
      occupied.push({ x, y, width, height });
      gsap.set(el, {
        x,
        y,
        scale: pose.scale,
        rotation: pose.rotation,
        opacity: 1,
        transformOrigin: "0 0",
      });
    });
    return targets.length;
  }, [getCanvasCenter, getCanvasPose, getCoverPose, getElement, getTargets, getViewport]);

  const placeAtCanvas = useCallback(() => {
    getTargets().forEach(({ id, el }) => {
      const pose = getCanvasPose(id);
      if (!pose) return;
      gsap.set(el, {
        x: pose.x,
        y: pose.y,
        scale: pose.scale,
        rotation: pose.rotation,
        opacity: 1,
        transformOrigin: "0 0",
      });
    });
  }, [getCanvasPose, getTargets]);

  const startDrift = useCallback(() => {
    const targets = getTargets();
    if (!targets.length) return 0;

    driftTweensRef.current.forEach((tween) => tween.kill());
    driftTweensRef.current = [];
    if (reducedMotion) return targets.length;

    const relocate = (id: string, el: HTMLElement, element: CoverElement) => {
      const liveTargets = getTargetsRef.current();
      const viewport = getViewport();
      const width = getCoverWidth(element, viewport.width);
      const height = width / element.coverPosition.aspectRatio;
      const occupied = liveTargets.flatMap((target) => {
        if (target.id === id) return [];
        const other = getElement(target.id);
        if (!other || other.showOnCover === false) return [];
        const opacity = Number(gsap.getProperty(target.el, "opacity"));
        if (opacity < 0.12) return [];
        const otherWidth = getCoverWidth(other, viewport.width);
        return [
          {
            x: Number(gsap.getProperty(target.el, "x")),
            y: Number(gsap.getProperty(target.el, "y")),
            width: otherWidth,
            height: otherWidth / other.coverPosition.aspectRatio,
          },
        ];
      });
      const next = pickCoverCanvasPoint(
        { width, height },
        occupied,
        viewport,
        getCanvasCenter(),
        {
          avoid: {
            x: Number(gsap.getProperty(el, "x")),
            y: Number(gsap.getProperty(el, "y")),
          },
        }
      );
      if (!next) return;
      gsap.set(el, { x: next.x, y: next.y });
    };

    targets.forEach(({ id, el }, index) => {
      const pose = getCoverPose(id);
      const element = getElement(id);
      if (!pose || !element || element.showOnCover === false) return;

      const viewport = getViewport();
      const coverWidth = getCoverWidth(element, viewport.width);
      const delta = getConvergenceDelta(
        element,
        pose,
        coverWidth,
        viewport.height,
        getCanvasCenter()
      );
      const driftNode = getDriftNode(el);
      const fadeOut = 2.2 + (index % 4) * 0.35;
      const fadeIn = 1.15;
      const visibleHold = 2.4 + (index % 3) * 0.7;

      const drift = gsap.to(driftNode, {
        x: delta.x * 2.1,
        y: delta.y * 2.1,
        rotation: 4.5,
        duration: Math.max(3.6, element.motion.duration * 0.24),
        delay: element.motion.delay,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        overwrite: "auto",
      });
      driftTweensRef.current.push(drift);

      const cycle = gsap.timeline({
        delay: element.motion.delay + index * 0.55,
        repeat: -1,
      });
      cycle.to(el, {
        opacity: 0,
        duration: fadeOut,
        ease: "sine.in",
      });
      cycle.add(() => relocate(id, el, element));
      cycle.to(el, {
        opacity: 1,
        duration: fadeIn,
        ease: "sine.out",
      });
      cycle.to({}, { duration: visibleHold });
      driftTweensRef.current.push(cycle);
    });

    return driftTweensRef.current.length;
  }, [
    getCanvasCenter,
    getCoverPose,
    getElement,
    getTargets,
    getViewport,
    reducedMotion,
  ]);

  const playToCanvas = useCallback(
    ({
      chrome,
      onComplete,
    }: {
      chrome: HTMLElement[];
      onComplete: () => void;
    }) => {
      killDrift();
      timelineRef.current?.kill();

      const targets = getTargets();

      if (reducedMotion) {
        gsap.set(chrome, { opacity: 0, scale: 1 });
        targets.forEach(({ id, el }) => {
          const pose = getCanvasPose(id);
          if (!pose) return;
          gsap.set(el, {
            x: pose.x,
            y: pose.y,
            scale: pose.scale,
            rotation: pose.rotation,
            opacity: 1,
          });
        });
        onComplete();
        return;
      }

      const timeline = gsap.timeline({
        onComplete,
      });
      timelineRef.current = timeline;

      timeline.to(
        chrome,
        {
          opacity: 0,
          scale: 0.96,
          duration: 0.38,
          ease: "power2.in",
        },
        0
      );

      targets.forEach(({ id, el }, index) => {
        const pose = getCanvasPose(id);
        const element = getElement(id);
        if (!pose) return;

        if (element?.showOnCover === false) {
          gsap.set(el, {
            x: pose.x,
            y: pose.y,
            scale: pose.scale * 0.92,
            rotation: pose.rotation,
            opacity: 0,
            transformOrigin: "0 0",
          });
          timeline.to(
            el,
            {
              opacity: 1,
              scale: pose.scale,
              duration: 0.72,
              ease: "power2.out",
            },
            0.38 + index * 0.03
          );
          return;
        }

        timeline.to(
          el,
          {
            x: pose.x,
            y: pose.y,
            scale: pose.scale,
            rotation: pose.rotation,
            opacity: 1,
            duration: 0.82,
            ease: "power3.inOut",
          },
          0.16 + index * 0.012
        );
      });
    },
    [getCanvasPose, getElement, getTargets, killDrift, reducedMotion]
  );

  useEffect(() => {
    return () => {
      driftTweensRef.current.forEach((tween) => tween.kill());
      driftTweensRef.current = [];
      timelineRef.current?.kill();
    };
  }, []);

  return {
    placeAtCover,
    placeAtCanvas,
    startDrift,
    playToCanvas,
    convergeToCenter,
    expandFromCenter,
    killDrift,
  };
}
