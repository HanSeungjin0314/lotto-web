import { Balls } from "@/components/Balls";
import { getDraws } from "@/lib/draws";
import { getNumberStats } from "@/lib/lotto";

export default async function StatsPage() {
  const draws = await getDraws();
  const stats = getNumberStats(draws);
  const rows = [...stats].sort((a, b) => b.totalCount - a.totalCount);
  return (
    <main className="wrap">
      <section className="panel">
        <h1>번호 통계</h1>
        <p className="muted">전체 출현 횟수, 최근 100회 출현 횟수, 마지막 출현 이후 경과 회차를 확인합니다.</p>
        <div className="grid two" style={{marginBottom:20}}>
          <div className="stat-card"><span>고빈도 TOP 6</span><div style={{marginTop:12}}><Balls numbers={rows.slice(0,6).map(r => r.number)} /></div></div>
          <div className="stat-card"><span>미출현 TOP 6</span><div style={{marginTop:12}}><Balls numbers={[...stats].sort((a,b)=>b.missingRounds-a.missingRounds).slice(0,6).map(r => r.number)} /></div></div>
        </div>
        <table>
          <thead><tr><th>번호</th><th>전체 출현</th><th>최근 100회</th><th>미출현 회차</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.number}>
                <td><Balls numbers={[row.number]} /></td>
                <td>{row.totalCount}</td>
                <td>{row.recent100Count}</td>
                <td>{row.missingRounds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
