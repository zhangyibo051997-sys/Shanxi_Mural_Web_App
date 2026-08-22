"use client";

export default function TextureBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-parchment" />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.35]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="paper-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-noise)" opacity="0.08" />
      </svg>
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgb(33 51 56 / 15%) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgb(168 56 38 / 8%) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgb(33 51 56 / 5%) 0%, transparent 60%)
          `,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="crack-pattern"
            x="0"
            y="0"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M10,50 Q40,30 80,55 T150,45 M30,120 Q60,100 90,130 T170,115"
              stroke="#213338"
              strokeWidth="0.5"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#crack-pattern)" />
      </svg>
    </div>
  );
}
