"use client";

import { useState } from "react";
import { Balls } from "@/components/Balls";
import type { GeneratedSet, PickMethod } from "@/types/lotto";

const methodLabels: Record<PickMethod, string> = {
  balanced: "균형형",
  hot: "고빈도형",
  cold: "미출현 반등형",
  recent: "최근100회형",
  random: "완전랜덤",
};

export function PickerClient({ initialSets }: { initialSets: GeneratedSet[] }) {
  const [method, setMethod] = useState<PickMethod>("balanced");
  const [sets, setSets] = useState<GeneratedSet[]>(initialSets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/generate?method=${method}&count=5`, { cache: "no-store" });
      if (!res.ok) throw new Error("번호 생성에 실패했습니다.");
      const json = await res.json();
      setSets(json.sets);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>번호 추첨</h2>
      <p className="muted">과거 데이터의 빈도, 최근성, 미출현 기간, 조합 균형 조건을 반영합니다.</p>
      <div className="controls">
        <select value={method} onChange={(e) => setMethod(e.target.value as PickMethod)}>
          {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button onClick={generate} disabled={loading}>{loading ? "생성 중..." : "추천번호 5세트 뽑기"}</button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {sets.map((set, idx) => (
        <div className="set-card" key={`${set.numbers.join("-")}-${idx}`}>
          <div style={{display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:12}}>
            <strong>{idx + 1}세트 · {methodLabels[set.method]}</strong>
            <span className="tag">점수 {set.score}</span>
          </div>
          <Balls numbers={set.numbers} />
          <div className="meta">
            <span className="tag">합계 {set.analysis.sum}</span>
            <span className="tag">홀짝 {set.analysis.odd}:{set.analysis.even}</span>
            <span className="tag">저/고 {set.analysis.low}:{set.analysis.high}</span>
            <span className="tag">연속쌍 {set.analysis.consecutivePairs}</span>
            <span className="tag">고빈도 {set.analysis.hotCount}개</span>
            <span className="tag">미출현 {set.analysis.coldCount}개</span>
          </div>
        </div>
      ))}
    </section>
  );
}
