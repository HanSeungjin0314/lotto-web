import { Balls } from "@/components/Balls";
import { getDraws } from "@/lib/draws";

export default async function HistoryPage() {
  const draws = [...await getDraws()].reverse();
  return (
    <main className="wrap">
      <section className="panel">
        <h1>역대 당첨번호</h1>
        <p className="muted">최신 회차부터 표시합니다.</p>
        <table>
          <thead><tr><th>회차</th><th>추첨일</th><th>당첨번호 + 보너스</th><th>1등 당첨자 수</th></tr></thead>
          <tbody>
            {draws.slice(0, 200).map((draw) => (
              <tr key={draw.draw_no}>
                <td>{draw.draw_no}회</td>
                <td>{draw.draw_date}</td>
                <td><Balls numbers={draw.numbers} bonus={draw.bonus} /></td>
                <td>{draw.first_winner_count ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">현재 화면은 성능을 위해 최근 200개 회차만 표시합니다. 필요하면 검색/페이지네이션을 추가하면 됩니다.</p>
      </section>
    </main>
  );
}
