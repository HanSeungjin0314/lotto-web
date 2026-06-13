import { NextResponse } from "next/server";
import { getDraws } from "@/lib/draws";

export async function GET() {
  const draws = await getDraws();
  return NextResponse.json({ draws, count: draws.length, latest: draws[draws.length - 1] ?? null });
}
