import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");

    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

function formatDate(yyyymmdd) {
  if (!yyyymmdd) return null;

  const text = String(yyyymmdd);

  if (text.length !== 8) return text;

  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

async function fetchDraw(drawNo) {
  const apiUrl =
    `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=${drawNo}&_=${Date.now()}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": "https://www.dhlottery.co.kr/gameResult.do?method=byWin",
    },
  });

  const body = await res.text();

  if (!res.ok) {
    console.log(`${drawNo}회차 조회 실패: HTTP ${res.status}`);
    console.log(body.slice(0, 120));
    return null;
  }

  if (body.trim().startsWith("<")) {
    console.log(`${drawNo}회차 조회 결과가 JSON이 아니라 HTML입니다.`);
    console.log(body.slice(0, 120));
    return null;
  }

  let json;

  try {
    json = JSON.parse(body);
  } catch (error) {
    console.log(`${drawNo}회차 JSON 파싱 실패`);
    console.log(body.slice(0, 120));
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

  if (nums.some((num) => !Number.isInteger(num) || num < 1 || num > 45)) {
    console.log(`${drawNo}회차 번호 형식이 이상합니다.`);
    return null;
  }

  return {
    draw_no: Number(row.ltEpsd),
    draw_date: formatDate(row.ltRflYmd),
    n1: nums[0],
    n2: nums[1],
    n3: nums[2],
    n4: nums[3],
    n5: nums[4],
    n6: nums[5],
    bonus: Number(row.bnsWnNo),
    first_prize_amount: row.rnk1WnAmt ? Number(row.rnk1WnAmt) : null,
    first_winner_count: row.rnk1WnNope ? Number(row.rnk1WnNope) : null,
  };
}

const { data: latestRows, error: latestError } = await supabase
  .from("lotto_draws")
  .select("draw_no")
  .order("draw_no", { ascending: false })
  .limit(1);

if (latestError) {
  console.error("DB 최신 회차 조회 실패:", latestError);
  process.exit(1);
}

let nextNo = (latestRows?.[0]?.draw_no ?? 0) + 1;
let savedCount = 0;

console.log(`현재 DB 최신 회차: ${nextNo - 1}`);
console.log(`${nextNo}회차부터 최신 회차까지 동기화를 시작합니다.`);

while (true) {
  const draw = await fetchDraw(nextNo);

  if (!draw) {
    console.log(`${nextNo}회차는 아직 공개되지 않았거나 조회할 수 없습니다.`);
    break;
  }

  const { error } = await supabase
    .from("lotto_draws")
    .upsert(draw, { onConflict: "draw_no" });

  if (error) {
    console.error(`${nextNo}회차 저장 실패:`, error);
    process.exit(1);
  }

  console.log(
    `${nextNo}회차 저장 완료: ${draw.n1}, ${draw.n2}, ${draw.n3}, ${draw.n4}, ${draw.n5}, ${draw.n6} + ${draw.bonus}`
  );

  savedCount += 1;
  nextNo += 1;

  await new Promise((resolve) => setTimeout(resolve, 400));
}

console.log(`동기화 완료. 추가 저장 회차 수: ${savedCount}`);