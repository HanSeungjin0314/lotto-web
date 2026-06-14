import { NextRequest, NextResponse } from "next/server";
import { addUpdateLog } from "@/lib/updateLogs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function getExpectedSecret() {
  return process.env.CRON_SECRET || process.env.ADMIN_SECRET || "";
}

function isAuthorized(req: NextRequest) {
  const expected = getExpectedSecret();

  if (!expected) {
    return false;
  }

  const authorization = req.headers.get("authorization");
  const bearerOk = authorization === `Bearer ${expected}`;

  const querySecret = req.nextUrl.searchParams.get("secret");
  const headerCronSecret = req.headers.get("x-cron-secret");
  const headerAdminSecret = req.headers.get("x-admin-secret");

  const manualOk =
    querySecret === expected ||
    headerCronSecret === expected ||
    headerAdminSecret === expected;

  return bearerOk || manualOk;
}

function getSource(req: NextRequest) {
  const authorization = req.headers.get("authorization");

  if (authorization) {
    return "cron";
  }

  return "manual";
}

function extractDrawNos(json: unknown): number[] {
  const data = json as {
    draws?: Array<{ draw_no?: number | string }>;
    draw?: { draw_no?: number | string };
    latest_draw_no?: number | string;
  };

  if (Array.isArray(data?.draws)) {
    return data.draws
      .map((d) => Number(d.draw_no))
      .filter((n) => Number.isFinite(n));
  }

  if (data?.draw?.draw_no) {
    const drawNo = Number(data.draw.draw_no);
    return Number.isFinite(drawNo) ? [drawNo] : [];
  }

  if (data?.latest_draw_no) {
    const drawNo = Number(data.latest_draw_no);
    return Number.isFinite(drawNo) ? [drawNo] : [];
  }

  return [];
}

function getSavedCount(json: unknown, drawNos: number[]) {
  const data = json as {
    count?: number;
    saved_count?: number;
  };

  if (typeof data?.count === "number") {
    return data.count;
  }

  if (typeof data?.saved_count === "number") {
    return data.saved_count;
  }

  return drawNos.length;
}

function getMessage(json: unknown) {
  const data = json as {
    message?: string;
    error?: string;
  };

  return data?.message || data?.error || null;
}

export async function GET(req: NextRequest) {
  const source = getSource(req);

  if (!isAuthorized(req)) {
    await addUpdateLog({
      status: "error",
      message: "Cron 인증 실패",
      saved_count: 0,
      draw_nos: [],
      error_message:
        "Authorization: Bearer CRON_SECRET 또는 secret 값이 올바르지 않습니다.",
      source,
    });

    return NextResponse.json(
      { error: "Cron 인증이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const secret = getExpectedSecret();

    const url = new URL("/api/update-latest", req.nextUrl.origin);
    url.searchParams.set("secret", secret);

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const text = await res.text();

    let json: unknown;

    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    const drawNos = extractDrawNos(json);
    const savedCount = getSavedCount(json, drawNos);
    const message = getMessage(json);

    if (!res.ok) {
      await addUpdateLog({
        status: "error",
        message: message || "업데이트 실패",
        saved_count: savedCount,
        draw_nos: drawNos,
        error_message: text.slice(0, 1000),
        source,
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
      message: message || "업데이트 완료",
      saved_count: savedCount,
      draw_nos: drawNos,
      error_message: null,
      source,
    });

    return NextResponse.json({
      logged: true,
      ok: true,
      message: message || "업데이트 완료",
      saved_count: savedCount,
      draw_nos: drawNos,
      upstream: json,
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
      source,
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