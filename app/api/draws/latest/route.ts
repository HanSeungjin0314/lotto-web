import { NextResponse } from "next/server";
import { getLatestDraw } from "@/lib/draws";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const latest = await getLatestDraw();

  return NextResponse.json({ latest });
}
