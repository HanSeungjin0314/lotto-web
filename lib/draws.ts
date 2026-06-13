import { createClient } from "@supabase/supabase-js";
import localDrawsJson from "@/data/lotto-draws.json";
import type { LottoDraw } from "@/types/lotto";

type LottoDrawRow = {
  id?: number;
  draw_no: number;
  draw_date: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
  bonus: number | null;
  first_prize_amount?: string | number | null;
  first_winner_count?: number | null;
};

function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch: (input, init = {}) => {
      return fetch(input, {
        ...init,
        cache: "no-store",
      });
    },
  },
});
}

function dbRowToDraw(row: LottoDrawRow): LottoDraw {
  const numbers = [row.n1, row.n2, row.n3, row.n4, row.n5, row.n6].sort(
    (a, b) => a - b
  );

  return {
    draw_no: Number(row.draw_no),
    draw_date: row.draw_date,
    numbers,
    bonus: row.bonus === null ? null : Number(row.bonus),
    first_prize_amount:
      row.first_prize_amount === undefined || row.first_prize_amount === null
        ? null
        : String(row.first_prize_amount),
    first_winner_count:
      row.first_winner_count === undefined || row.first_winner_count === null
        ? null
        : Number(row.first_winner_count),
  };
}

function normalizeLocalDraw(row: any): LottoDraw {
  if (Array.isArray(row.numbers)) {
    return {
      draw_no: Number(row.draw_no),
      draw_date: row.draw_date,
      numbers: row.numbers.map(Number).sort((a: number, b: number) => a - b),
      bonus:
        row.bonus === null || row.bonus === undefined
          ? null
          : Number(row.bonus),
      first_prize_amount:
        row.first_prize_amount === undefined || row.first_prize_amount === null
          ? null
          : String(row.first_prize_amount),
      first_winner_count:
        row.first_winner_count === undefined || row.first_winner_count === null
          ? null
          : Number(row.first_winner_count),
    };
  }

  return dbRowToDraw(row);
}

const localDraws: LottoDraw[] = (localDrawsJson as any[])
  .map(normalizeLocalDraw)
  .sort((a, b) => a.draw_no - b.draw_no);

export async function getDraws(): Promise<LottoDraw[]> {
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return localDraws;
  }

  const pageSize = 1000;
  let from = 0;
  const rows: LottoDrawRow[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("lotto_draws")
      .select("*")
      .order("draw_no", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Supabase getDraws error:", error.message);
      return localDraws;
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  if (rows.length === 0) {
    return localDraws;
  }

  return rows.map(dbRowToDraw);
}

export async function getLatestDraw(): Promise<LottoDraw | null> {
  const draws = await getDraws();

  if (draws.length === 0) {
    return null;
  }

  return draws[draws.length - 1];
}

export async function addDraw(draw: LottoDraw): Promise<LottoDraw> {
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    throw new Error(
      "Supabase ?섍꼍蹂?섍? ?놁뒿?덈떎. .env ?뚯씪??NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY瑜??뺤씤?섏꽭??"
    );
  }

  const numbers = [...draw.numbers].sort((a, b) => a - b);

  const { data, error } = await supabase
    .from("lotto_draws")
    .upsert(
      {
        draw_no: draw.draw_no,
        draw_date: draw.draw_date,
        n1: numbers[0],
        n2: numbers[1],
        n3: numbers[2],
        n4: numbers[3],
        n5: numbers[4],
        n6: numbers[5],
        bonus: draw.bonus,
        first_prize_amount: draw.first_prize_amount ?? null,
        first_winner_count: draw.first_winner_count ?? null,
      },
      { onConflict: "draw_no" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(
      `${error.message}${error.details ? " / " + error.details : ""}`
    );
  }

  return dbRowToDraw(data);
}
