import { NextResponse } from "next/server";
import coverAssetsManifest from "@/data/generated/cover-assets.json";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(coverAssetsManifest);
}
