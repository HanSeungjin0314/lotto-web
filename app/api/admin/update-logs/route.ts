import { NextRequest, NextResponse } from "next/server";
import { getUpdateLogs } from "@/lib/updateLogs";

export const dynamic = "force-dynamic";

function isValidAdmin(req: NextRequest) {
  const expected = process.env.ADMIN_SECRET;
  const actual = req.headers.get("x-admin-secret");

  return Boolean(expected && actual && actual === expected);
}

export async function GET(req: NextRequest) {
  if (!isValidAdmin(req)) {
    return NextResponse.json(
      { error: "관리자 인증이 필요합니다." },
      { status: 401 }
    );
  }

  const logs = await getUpdateLogs(30);

  return NextResponse.json({ logs });
}