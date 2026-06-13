import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const draws = JSON.parse(fs.readFileSync("./data/lotto-draws.json", "utf-8"));

const rows = draws.map((draw) => {
  const nums = [...draw.numbers].sort((a, b) => a - b);
  return {
    draw_no: draw.draw_no,
    draw_date: draw.draw_date,
    n1: nums[0], n2: nums[1], n3: nums[2], n4: nums[3], n5: nums[4], n6: nums[5],
    bonus: draw.bonus,
    first_prize_amount: draw.first_prize_amount,
    first_winner_count: draw.first_winner_count,
  };
});

const chunkSize = 400;
let inserted = 0;
for (let i = 0; i < rows.length; i += chunkSize) {
  const chunk = rows.slice(i, i + chunkSize);
  const { error } = await supabase.from("lotto_draws").upsert(chunk, { onConflict: "draw_no" });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  inserted += chunk.length;
  console.log(`${inserted}/${rows.length} 처리 완료`);
}
console.log("초기 데이터 업로드 완료");
