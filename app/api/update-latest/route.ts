import { NextRequest, NextResponse } from "next/server";
import { addDraw, getDraws } from "@/lib/draws";
import { validateDrawInput } from "@/lib/lotto";
import type { LottoDraw } from "@/types/lotto";

export const dynamic = "force-dynamic";

function formatDate(yyyymmdd: string | number | null | undefined) {
  if (!yyyymmdd) return "";

  const text = String(yyyymmdd);

  if (text.length !== 8) return text;

  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

async function fetchDraw(drawNo: number): Promise<LottoDraw | null> {
  const apiUrl =
    `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=${drawNo}&_=${Date.now()}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://www.dhlottery.co.kr/gameResult.do?method=byWin",
    },
  });

  const body = await res.text();

  if (!res.ok) {
    return null;
  }

  if (body.trim().startsWith("<")) {
    return null;
  }

  let json: any;

  try {
    json = JSON.parse(body);
  } catch {
    return null;
  }

  const row = json?.data?.list?.[0];

  if (!row) {
    return null;
  }

  const nums = [
    Number(row.tm1WnNo),
    Number(row.tm2WnNo),
    Number(row.tm3WnNo),
    Number(row.tm4WnNo),
    Number(row.tm5WnNo),
    Number(row.tm6WnNo),
  ].sort((a, b) => a - b);

  return {
    draw_no: Number(row.ltEpsd),
    draw_date: formatDate(row.ltRflYmd),
    numbers: nums,
    bonus: Number(row.bnsWnNo),
    first_prize_amount: row.rnk1WnAmt ? String(row.rnk1WnAmt) : null,
    first_winner_count: row.rnk1WnNope ? Number(row.rnk1WnNope) : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const expected = process.env.CRON_SECRET || process.env.ADMIN_SECRET;
    const actual =
      req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
    const cronHeader = req.headers.get("x-vercel-cron");

    if (expected && actual !== expected && !cronHeader) {
      return NextResponse.json(
        { error: "업데이트 토큰이 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const draws = await getDraws();
    const latest = draws[draws.length - 1];
    const nextNo = (latest?.draw_no ?? 0) + 1;

    const next = await fetchDraw(nextNo);

    if (!next) {
      return NextResponse.json({
        message: "추가할 신규 회차가 없습니다.",
        latest_draw_no: latest?.draw_no ?? null,
        next_draw_no: nextNo,
        saved: false,
        count: 0,
        draws: [],
      });
    }

    const errors = validateDrawInput(next);

    if (errors.length) {
      return NextResponse.json(
        { error: `${nextNo}회차 검증 실패: ${errors.join(" ")}` },
        { status: 400 }
      );
    }

    const saved = await addDraw(next);

    return NextResponse.json({
      message: "1개 회차를 저장했습니다.",
      saved: true,
      count: 1,
      latest_draw_no: saved.draw_no,
      draw: {
        draw_no: saved.draw_no,
        draw_date: saved.draw_date,
        numbers: saved.numbers,
        bonus: saved.bonus,
      },
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