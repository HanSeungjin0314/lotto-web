export const dynamic = "force-dynamic";
import { Balls } from "@/components/Balls";
import { PickerClient } from "@/components/PickerClient";
import { getDraws } from "@/lib/draws";
import { generateMany, getNumberStats } from "@/lib/lotto";

export default async function HomePage() {
  const draws = await getDraws();
  const latest = draws[draws.length - 1];
  const stats = getNumberStats(draws);
  const hotTop = [...stats].sort((a, b) => b.totalCount - a.totalCount).slice(0, 6).map((s) => s.number);
  const coldTop = [...stats].sort((a, b) => b.missingRounds - a.missingRounds).slice(0, 6).map((s) => s.number);
  const initialSets = generateMany(draws, "balanced", 5);

  return (
    <main className="wrap">
      <section className="hero">
        <div className="panel">
          <p className="tag">역대 당첨번호 기반</p>
          <h1>로또 통계형 번호 추첨기</h1>
          <p className="muted">엑셀의 역대 당첨번호를 초기 데이터로 사용하고, 앞으로 새 회차를 계속 누적해 추천 조합에 반영하는 웹앱입니다.</p>
          <div className="grid" style={{marginTop:24}}>
            <div className="stat-card"><span>총 회차</span><strong>{draws.length.toLocaleString()}</strong></div>
            <div className="stat-card"><span>최신 회차</span><strong>{latest?.draw_no}회</strong></div>
            <div className="stat-card"><span>최근 추첨일</span><strong style={{fontSize:18}}>{latest?.draw_date}</strong></div>
          </div>
        </div>
        <div className="panel">
          <h2>최근 당첨번호</h2>
          <p className="muted">{latest?.draw_no}회 · {latest?.draw_date}</p>
          <Balls numbers={latest?.numbers ?? []} bonus={latest?.bonus} />
          <hr style={{border:0, borderTop:"1px solid var(--border)", margin:"24px 0"}} />
          <h3>현재 데이터 기준 TOP 번호</h3>
          <p className="muted">고빈도 번호</p>
          <Balls numbers={hotTop} />
          <p className="muted">장기 미출현 번호</p>
          <Balls numbers={coldTop} />
        </div>
      </section>

      <div style={{height:22}} />
      <PickerClient initialSets={initialSets} />

      <div style={{height:22}} />
      <section className="panel notice">
        <strong>주의:</strong> 로또는 독립 확률 게임입니다. 이 앱은 통계 기반 조합 생성 도구이며 당첨을 보장하지 않습니다.
      </section>
    </main>
  );
}
