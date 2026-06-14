import { NextRequest, NextResponse } from "next/server";
import { addDraw, getLatestDraw } from "@/lib/draws";
import { fetchLottoDraw } from "@/lib/dhlottery";
import { validateDrawInput } from "@/lib/lotto";
import type { LottoDraw } from "@/types/lotto";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const MAX_SYNC_COUNT = Number(process.env.LOTTO_MAX_SYNC_COUNT || 30);

function isAuthorized(req: NextRequest) {
  const expected = process.env.CRON_SECRET || process.env.ADMIN_SECRET;
  const actual =
    req.headers.get("x-cron-secret") ||
    req.headers.get("x-admin-secret") ||
    req.nextUrl.searchParams.get("secret");
  const authorization = req.headers.get("authorization");

  if (!expected) {
    return false;
  }

  return actual === expected || authorization === `Bearer ${expected}`;
}

async function saveOneDraw(draw: LottoDraw) {
  const errors = validateDrawInput(draw);

  if (errors.length) {
    throw new Error(`${draw.draw_no}회차 검증 실패: ${errors.join(" ")}`);
  }

  return addDraw(draw);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "업데이트 토큰이 올바르지 않습니다." },
      { status: 401 }
    );
  }

  try {
    const latest = await getLatestDraw();
    let nextNo = (latest?.draw_no ?? 0) + 1;
    const savedDraws: LottoDraw[] = [];
    const maxSyncCount = Number.isFinite(MAX_SYNC_COUNT) && MAX_SYNC_COUNT > 0
      ? Math.floor(MAX_SYNC_COUNT)
      : 30;

    while (savedDraws.length < maxSyncCount) {
      const next = await fetchLottoDraw(nextNo);

      if (!next) {
        break;
      }

      const saved = await saveOneDraw(next);
      savedDraws.push(saved);
      nextNo += 1;
    }

    if (savedDraws.length === 0) {
      return NextResponse.json({
        message: "추가할 신규 회차가 없습니다.",
        latest_draw_no: latest?.draw_no ?? null,
        next_draw_no: nextNo,
        saved: false,
        count: 0,
        draws: [],
      });
    }

    return NextResponse.json({
      message: `${savedDraws.length}개 회차를 저장했습니다.`,
      saved: true,
      count: savedDraws.length,
      latest_draw_no: savedDraws[savedDraws.length - 1]?.draw_no ?? null,
      draws: savedDraws.map((draw) => ({
        draw_no: draw.draw_no,
        draw_date: draw.draw_date,
        numbers: draw.numbers,
        bonus: draw.bonus,
      })),
      draw: savedDraws[savedDraws.length - 1] ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "알 수 없는 서버 오류",
      },
      { status: 500 }
    );
  }
}
