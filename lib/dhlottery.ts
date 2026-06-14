import type { LottoDraw } from "@/types/lotto";

function formatDate(value: string | number | null | undefined) {
  if (!value) return "";

  const text = String(value);

  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  }

  return text;
}

function normalizeAmount(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function isValidNumber(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 45;
}

export async function fetchLottoDraw(drawNo: number): Promise<LottoDraw | null> {
  if (!Number.isInteger(drawNo) || drawNo < 1) {
    return null;
  }

  const apiUrl = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!res.ok) {
    return null;
  }

  let json: {
    returnValue?: string;
    drwNo?: number;
    drwNoDate?: string;
    drwtNo1?: number;
    drwtNo2?: number;
    drwtNo3?: number;
    drwtNo4?: number;
    drwtNo5?: number;
    drwtNo6?: number;
    bnusNo?: number;
    firstWinamnt?: number;
    firstPrzwnerCo?: number;
  };

  try {
    json = await res.json();
  } catch {
    return null;
  }

  if (json.returnValue !== "success") {
    return null;
  }

  const numbers = [
    Number(json.drwtNo1),
    Number(json.drwtNo2),
    Number(json.drwtNo3),
    Number(json.drwtNo4),
    Number(json.drwtNo5),
    Number(json.drwtNo6),
  ].sort((a, b) => a - b);

  const bonus = Number(json.bnusNo);

  if (numbers.some((number) => !isValidNumber(number)) || !isValidNumber(bonus)) {
    return null;
  }

  return {
    draw_no: Number(json.drwNo ?? drawNo),
    draw_date: formatDate(json.drwNoDate),
    numbers,
    bonus,
    first_prize_amount: normalizeAmount(json.firstWinamnt),
    first_winner_count:
      json.firstPrzwnerCo === null || json.firstPrzwnerCo === undefined
        ? null
        : Number(json.firstPrzwnerCo),
  };
}
