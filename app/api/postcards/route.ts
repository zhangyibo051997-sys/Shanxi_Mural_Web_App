import { NextResponse } from "next/server";
import postcardsManifest from "@/data/generated/postcards.json";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(postcardsManifest);
}
