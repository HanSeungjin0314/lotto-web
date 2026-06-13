import { NextRequest, NextResponse } from "next/server";
import { getDraws } from "@/lib/draws";
import { generateMany } from "@/lib/lotto";
import type { PickMethod } from "@/types/lotto";

const methods: PickMethod[] = ["balanced", "hot", "cold", "recent", "random"];

export async function GET(req: NextRequest) {
  const methodParam = req.nextUrl.searchParams.get("method") as PickMethod | null;
  const method = methodParam && methods.includes(methodParam) ? methodParam : "balanced";
  const count = Math.min(Math.max(Number(req.nextUrl.searchParams.get("count") || 5), 1), 20);
  const draws = await getDraws();
  const sets = generateMany(draws, method, count);
  return NextResponse.json({ method, sets });
}
