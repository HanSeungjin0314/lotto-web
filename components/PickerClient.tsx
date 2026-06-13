"use client";

import { useState } from "react";
import { Balls } from "@/components/Balls";
import type { GeneratedSet, PickMethod } from "@/types/lotto";

const methodLabels: Record<PickMethod, string> = {
  balanced: "균형형",
  hot: "고빈도형",
  cold: "미출현형",
  recent: "최근100회형",
  random: "완전랜덤",
};

const methodDescriptions: Record<PickMethod, string> = {
  balanced: "합계·홀짝·고저·최근성까지 고르게 반영",
  hot: "역대 출현 빈도가 높은 번호 중심",
  cold: "오랫동안 나오지 않은 번호 중심",
  recent: "최근 100회 흐름을 더 강하게 반영",
  random: "통계 가중치 없이 무작위 생성",
};

const methods: PickMethod[] = ["balanced", "hot", "cold", "recent", "random"];

function formatNumbers(numbers: number[]) {
  return numbers.map((n) => String(n).padStart(2, "0")).join(", ");
}

export function PickerClient({ initialSets }: { initialSets: GeneratedSet[] }) {
  const [method, setMethod] = useState<PickMethod>("balanced");
  const [count, setCount] = useState(5);
  const [sets, setSets] = useState<GeneratedSet[]>(initialSets);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"success" | "error" | "">("");

  async function generate() {
    setLoading(true);
    setMessage("");
    setKind("");

    try {
      const res = await fetch(`/api/generate?method=${method}&count=${count}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "번호 생성에 실패했습니다.");
      }

      setSets(json.sets || []);
      setKind("success");
      setMessage(`${methodLabels[method]} 추천번호 ${count}세트를 생성했습니다.`);
    } catch (error) {
      setKind("error");
      setMessage(
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setKind("success");
      setMessage("추천번호를 복사했습니다.");
    } catch {
      setKind("error");
      setMessage("복사에 실패했습니다. 브라우저 권한을 확인하세요.");
    }
  }

  function copySet(set: GeneratedSet, index: number) {
    const text = `${index + 1}세트: ${formatNumbers(set.numbers)}`;
    copyText(text);
  }

  function copyAll() {
    const text = sets
      .map((set, index) => `${index + 1}세트: ${formatNumbers(set.numbers)}`)
      .join("\n");

    copyText(text);
  }

  return (
    <section className="panel picker-panel">
      <div className="picker-head">
        <div>
          <p className="tag">통계 기반 추천</p>
          <h2>추천번호 생성</h2>
          <p className="muted">
            과거 데이터의 빈도, 최근성, 미출현 기간, 조합 균형 조건을 반영합니다.
          </p>
        </div>

        <button className="secondary" onClick={copyAll} disabled={!sets.length}>
          전체 복사
        </button>
      </div>

      <div className="method-grid">
        {methods.map((item) => (
          <button
            key={item}
            type="button"
            className={`method-card ${method === item ? "selected" : ""}`}
            onClick={() => setMethod(item)}
          >
            <strong>{methodLabels[item]}</strong>
            <span>{methodDescriptions[item]}</span>
          </button>
        ))}
      </div>

      <div className="picker-toolbar">
        <div className="count-tabs">
          {[5, 10, 20].map((value) => (
            <button
              key={value}
              type="button"
              className={count === value ? "selected" : "ghost"}
              onClick={() => setCount(value)}
            >
              {value}세트
            </button>
          ))}
        </div>

        <button onClick={generate} disabled={loading}>
          {loading ? "생성 중..." : `${methodLabels[method]} 추천번호 뽑기`}
        </button>
      </div>

      {message ? <p className={kind || "muted"}>{message}</p> : null}

      <div className="set-grid">
        {sets.map((set, idx) => (
          <div className="set-card enhanced" key={`${set.numbers.join("-")}-${idx}`}>
            <div className="set-title">
              <div>
                <strong>{idx + 1}세트</strong>
                <span>{methodLabels[set.method]}</span>
              </div>

              <button
                className="copy-button"
                type="button"
                onClick={() => copySet(set, idx)}
              >
                복사
              </button>
            </div>

            <Balls numbers={set.numbers} />

            <div className="meta">
              <span className="tag">점수 {set.score}</span>
              <span className="tag">합계 {set.analysis.sum}</span>
              <span className="tag">
                홀짝 {set.analysis.odd}:{set.analysis.even}
              </span>
              <span className="tag">
                저/고 {set.analysis.low}:{set.analysis.high}
              </span>
              <span className="tag">연속쌍 {set.analysis.consecutivePairs}</span>
              <span className="tag">고빈도 {set.analysis.hotCount}개</span>
              <span className="tag">미출현 {set.analysis.coldCount}개</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
