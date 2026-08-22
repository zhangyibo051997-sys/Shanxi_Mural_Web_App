"use client";

import NavMark from "./NavMark";

interface SiteBrandProps {
  compact?: boolean;
  href?: string | null;
  size?: "nav" | "intro";
  onClick?: () => void;
}

export default function SiteBrand({
  href = "/",
  onClick,
}: SiteBrandProps) {
  return <NavMark href={href ?? "/"} onClick={onClick} />;
}
