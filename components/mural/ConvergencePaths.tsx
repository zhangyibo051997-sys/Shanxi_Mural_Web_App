"use client";

interface ConvergencePathsProps {
  visible: boolean;
  reduced: boolean;
}

export default function ConvergencePaths({
  visible,
  reduced,
}: ConvergencePathsProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full transition-opacity duration-500"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ opacity: visible ? (reduced ? 0.1 : 0.28) : 0 }}
    >
      <defs>
        <marker
          id="orbit-arrow"
          markerWidth="7"
          markerHeight="7"
          refX="5"
          refY="3.5"
          orient="auto"
        >
          <path d="M0 0.6 L6.2 3.5 L0 6.4 Z" fill="rgb(33 51 56 / 20%)" />
        </marker>
      </defs>

      <g
        fill="none"
        stroke="rgb(33 51 56 / 10%)"
        strokeWidth="1"
        strokeDasharray="1.8 8.5"
        strokeLinecap="round"
      >
        <ellipse cx="720" cy="412" rx="218" ry="146" />
        <ellipse cx="720" cy="412" rx="338" ry="226" />
        <ellipse cx="720" cy="412" rx="468" ry="312" />
        <ellipse cx="720" cy="412" rx="598" ry="392" />
        <ellipse cx="720" cy="412" rx="728" ry="468" />
      </g>

      <g fill="none" stroke="rgb(33 51 56 / 10%)" strokeWidth="1" strokeLinecap="round">
        <path
          d="M 1056 330 A 338 226 0 0 1 1020 520"
          markerEnd="url(#orbit-arrow)"
        />
        <path
          d="M 390 520 A 338 226 0 0 1 430 300"
          markerEnd="url(#orbit-arrow)"
        />
        <path
          d="M 250 390 A 468 312 0 0 1 320 220"
          markerEnd="url(#orbit-arrow)"
        />
      </g>

      <g fill="#A83826">
        <circle cx="502" cy="412" r="2.2" opacity="0.8" />
        <circle cx="938" cy="412" r="2.2" opacity="0.8" />
        <circle cx="720" cy="186" r="2" opacity="0.72" />
        <circle cx="720" cy="638" r="2" opacity="0.72" />
        <circle cx="382" cy="250" r="1.8" opacity="0.62" />
        <circle cx="1058" cy="250" r="1.8" opacity="0.62" />
        <circle cx="382" cy="574" r="1.8" opacity="0.62" />
        <circle cx="1058" cy="574" r="1.8" opacity="0.62" />
        <circle cx="252" cy="412" r="1.7" opacity="0.5" />
        <circle cx="1188" cy="412" r="1.7" opacity="0.5" />
        <circle cx="560" cy="168" r="1.5" opacity="0.45" />
        <circle cx="880" cy="168" r="1.5" opacity="0.45" />
      </g>
    </svg>
  );
}
