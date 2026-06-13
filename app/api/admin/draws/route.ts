import { NextRequest, NextResponse } from "next/server";
import { addDraw, getDraws } from "@/lib/draws";
import { validateDrawInput } from "@/lib/lotto";
import type { LottoDraw } from "@/types/lotto";

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_SECRET;
  const actual = req.headers.get("x-admin-secret");
  if (!expected || actual !== expected) {
    return NextResponse.json({ error: "관리자 토큰이 올바르지 않습니다." }, { status: 401 });
  }

  const input = await req.json() as LottoDraw;
  const numbers = [...input.numbers].sort((a, b) => a - b);
  const draw: LottoDraw = { ...input, numbers };
  const errors = validateDrawInput(draw);
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

  const existing = await getDraws();
  if (existing.some((d) => d.draw_no === draw.draw_no)) {
    return NextResponse.json({ error: `${draw.draw_no}회차는 이미 존재합니다.` }, { status: 409 });
  }

  try {
    const saved = await addDraw(draw);
    return NextResponse.json({ draw: saved });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB 저장 오류" }, { status: 500 });
  }
}
