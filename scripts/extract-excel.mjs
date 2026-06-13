import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const input = process.argv[2] || "./역대 로또 당첨번호(정리).xlsx";
const output = process.argv[3] || "./data/lotto-draws.json";

const workbook = XLSX.readFile(input);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

const draws = rows
  .map((row) => {
    const drawNo = Number(row["회차"]);
    const numbers = ["첫번째", "두번째", "세번째", "네번째", "다섯번째", "여섯번째"].map((key) => Number(row[key]));
    return {
      draw_no: drawNo,
      draw_date: String(row["추첨일"] ?? "").slice(0, 10),
      numbers: numbers.sort((a, b) => a - b),
      bonus: row["보너스"] ? Number(row["보너스"]) : null,
      first_prize_amount: row["1등 당첨금액"] ? String(row["1등 당첨금액"]) : null,
      first_winner_count: row["1등 당첨자 수"] ? Number(row["1등 당첨자 수"]) : null,
    };
  })
  .filter((draw) => Number.isInteger(draw.draw_no) && draw.numbers.length === 6 && draw.numbers.every((n) => n >= 1 && n <= 45))
  .sort((a, b) => a.draw_no - b.draw_no);

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(draws, null, 2), "utf-8");
console.log(`${draws.length}개 회차를 ${output}에 저장했습니다.`);
