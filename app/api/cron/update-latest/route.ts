import { NextRequest, NextResponse } from "next/server";
import { addUpdateLog } from "@/lib/updateLogs";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const expected = process.env.CRON_SECRET || process.env.ADMIN_SECRET;
  const actual =
    req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  const cronHeader = req.headers.get("x-vercel-cron");

  return Boolean(cronHeader || (expected && actual === expected));
}

function extractDrawNos(json: any): number[] {
  if (Array.isArray(json?.draws)) {
    return json.draws
      .map((d: any) => Number(d.draw_no))
      .filter((n: number) => Number.isFinite(n));
  }

  if (json?.draw?.draw_no) {
    return [Number(json.draw.draw_no)];
  }

  return [];
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Cron 인증이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const secret = process.env.CRON_SECRET || process.env.ADMIN_SECRET || "";
    const url = new URL("/api/update-latest", req.nextUrl.origin);
    url.searchParams.set("secret", secret);

    const res = await fetch(url, {
      cache: "no-store",
    });

    const text = await res.text();

    let json: any;

    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    const drawNos = extractDrawNos(json);
    const savedCount =
      typeof json?.count === "number" ? json.count : drawNos.length;

    if (!res.ok) {
      await addUpdateLog({
        status: "error",
        message: json?.message ?? null,
        saved_count: savedCount,
        draw_nos: drawNos,
        error_message: json?.error ?? text.slice(0, 500),
        source: "cron",
      });

      return NextResponse.json(
        {
          logged: true,
          ok: false,
          upstream: json,
        },
        { status: res.status }
      );
    }

    await addUpdateLog({
      status: "success",
      message: json?.message ?? "업데이트 완료",
      saved_count: savedCount,
      draw_nos: drawNos,
      error_message: null,
      source: "cron",
    });

    return NextResponse.json({
      logged: true,
      ok: true,
      ...json,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 Cron 오류";

    await addUpdateLog({
      status: "error",
      message: "Cron 실행 실패",
      saved_count: 0,
      draw_nos: [],
      error_message: message,
      source: "cron",
    });

    return NextResponse.json(
      {
        logged: true,
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}