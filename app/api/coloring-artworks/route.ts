import { NextResponse } from "next/server";
import coloringManifest from "@/data/generated/coloring-artworks.json";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(coloringManifest);
}
