"use client";

import { useEffect, useState } from "react";
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

type SavedPick = {
  id: string;
  numbers: number[];
  method: PickMethod;
  savedAt: string;
};

type LatestDraw = {
  draw_no: number;
  draw_date: string;
  numbers: number[];
  bonus?: number | null;
};

type MatchResult = {
  matchCount: number;
  bonusMatch: boolean;
  rank: string;
  rankClass: string;
  matchedNumbers: number[];
};

function formatNumbers(numbers: number[]) {
  return numbers.map((n) => String(n).padStart(2, "0")).join(", ");
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getLatestFromResponse(json: unknown): LatestDraw | null {
  const data = json as {
    latest?: LatestDraw | null;
    draws?: LatestDraw[];
    data?: LatestDraw[];
  };

  if (data.latest) {
    return data.latest;
  }

  if (Array.isArray(json)) {
    const latest = json[json.length - 1] as LatestDraw | undefined;
    return latest ?? null;
  }

  if (Array.isArray(data.draws)) {
    return data.draws[data.draws.length - 1] ?? null;
  }

  if (Array.isArray(data.data)) {
    return data.data[data.data.length - 1] ?? null;
  }

  return null;
}

function comparePick(numbers: number[], latestDraw: LatestDraw | null): MatchResult {
  if (!latestDraw) {
    return {
      matchCount: 0,
      bonusMatch: false,
      rank: "비교 대기",
      rankClass: "pending",
      matchedNumbers: [],
    };
  }

  const matchedNumbers = numbers.filter((n) => latestDraw.numbers.includes(n));
  const matchCount = matchedNumbers.length;
  const bonusMatch = latestDraw.bonus ? numbers.includes(latestDraw.bonus) : false;

  if (matchCount === 6) {
    return { matchCount, bonusMatch, rank: "1등", rankClass: "rank-first", matchedNumbers };
  }

  if (matchCount === 5 && bonusMatch) {
    return { matchCount, bonusMatch, rank: "2등", rankClass: "rank-second", matchedNumbers };
  }

  if (matchCount === 5) {
    return { matchCount, bonusMatch, rank: "3등", rankClass: "rank-third", matchedNumbers };
  }

  if (matchCount === 4) {
    return { matchCount, bonusMatch, rank: "4등", rankClass: "rank-fourth", matchedNumbers };
  }

  if (matchCount === 3) {
    return { matchCount, bonusMatch, rank: "5등", rankClass: "rank-fifth", matchedNumbers };
  }

  return { matchCount, bonusMatch, rank: "낙첨", rankClass: "rank-none", matchedNumbers };
}

export function PickerClient({ initialSets }: { initialSets: GeneratedSet[] }) {
  const [method, setMethod] = useState<PickMethod>("balanced");
  const [count, setCount] = useState(5);
  const [sets, setSets] = useState<GeneratedSet[]>(initialSets);
  const [savedPicks, setSavedPicks] = useState<SavedPick[]>([]);
  const [latestDraw, setLatestDraw] = useState<LatestDraw | null>(null);
  const [latestLoading, setLatestLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"success" | "error" | "">("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lotto-saved-picks");

      if (raw) {
        const parsed = JSON.parse(raw) as SavedPick[];

        if (Array.isArray(parsed)) {
          setSavedPicks(parsed);
        }
      }
    } catch {
      setSavedPicks([]);
    }
  }, []);

  useEffect(() => {
    loadLatestDraw(false);
  }, []);

  function updateSavedPicks(next: SavedPick[]) {
    setSavedPicks(next);
    localStorage.setItem("lotto-saved-picks", JSON.stringify(next));
  }

  async function loadLatestDraw(showMessage = true) {
    setLatestLoading(true);

    try {
      const res = await fetch("/api/draws/latest", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "최신 당첨번호를 불러오지 못했습니다.");
      }

      const latest = getLatestFromResponse(json);

      if (!latest) {
        throw new Error("최신 당첨번호 데이터가 없습니다.");
      }

      setLatestDraw(latest);

      if (showMessage) {
        setKind("success");
        setMessage(`${latest.draw_no}회 당첨번호를 불러왔습니다.`);
      }
    } catch (error) {
      if (showMessage) {
        setKind("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "최신 당첨번호 확인 중 오류가 발생했습니다."
        );
      }
    } finally {
      setLatestLoading(false);
    }
  }

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

  function copySavedPick(pick: SavedPick, index: number) {
    const result = comparePick(pick.numbers, latestDraw);

    const text = [
      `저장번호 ${index + 1}: ${formatNumbers(pick.numbers)}`,
      latestDraw
        ? `최신 ${latestDraw.draw_no}회 비교: ${result.matchCount}개 일치 / ${result.rank}`
        : "최신 당첨번호 비교 전",
    ].join("\n");

    copyText(text);
  }

  function copyAll() {
    const text = sets
      .map((set, index) => `${index + 1}세트: ${formatNumbers(set.numbers)}`)
      .join("\n");

    copyText(text);
  }

  function copyAllSaved() {
    const text = savedPicks
      .map((pick, index) => {
        const date = new Date(pick.savedAt).toLocaleString("ko-KR");
        const result = comparePick(pick.numbers, latestDraw);

        return `${index + 1}. ${formatNumbers(pick.numbers)} / ${
          methodLabels[pick.method]
        } / ${date} / ${
          latestDraw ? `${result.matchCount}개 일치, ${result.rank}` : "비교 전"
        }`;
      })
      .join("\n");

    copyText(text);
  }

  function saveSet(set: GeneratedSet) {
    const duplicated = savedPicks.some(
      (pick) => pick.numbers.join("-") === set.numbers.join("-")
    );

    if (duplicated) {
      setKind("error");
      setMessage("이미 저장된 번호입니다.");
      return;
    }

    const next: SavedPick[] = [
      {
        id: createId(),
        numbers: set.numbers,
        method: set.method,
        savedAt: new Date().toISOString(),
      },
      ...savedPicks,
    ].slice(0, 50);

    updateSavedPicks(next);
    setKind("success");
    setMessage("번호를 저장했습니다.");
  }

  function removeSavedPick(id: string) {
    const next = savedPicks.filter((pick) => pick.id !== id);
    updateSavedPicks(next);
    setKind("success");
    setMessage("저장한 번호를 삭제했습니다.");
  }

  function clearSavedPicks() {
    if (!confirm("저장한 번호를 모두 삭제할까요?")) {
      return;
    }

    updateSavedPicks([]);
    setKind("success");
    setMessage("저장한 번호를 모두 삭제했습니다.");
  }

  return (
    <>
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
            <div
              className="set-card enhanced"
              key={`${set.numbers.join("-")}-${idx}`}
            >
              <div className="set-title">
                <div>
                  <strong>{idx + 1}세트</strong>
                  <span>{methodLabels[set.method]}</span>
                </div>

                <div className="set-actions">
                  <button
                    className="copy-button"
                    type="button"
                    onClick={() => saveSet(set)}
                  >
                    저장
                  </button>

                  <button
                    className="copy-button"
                    type="button"
                    onClick={() => copySet(set, idx)}
                  >
                    복사
                  </button>
                </div>
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

      <section className="panel saved-picks-panel">
        <div className="picker-head">
          <div>
            <p className="tag">MY PICKS</p>
            <h2>저장한 번호</h2>
            <p className="muted">
              마음에 드는 추천번호를 저장해두고 최신 당첨번호와 비교할 수 있습니다.
            </p>
          </div>

          <div className="saved-actions">
            <button
              className="secondary"
              type="button"
              onClick={() => loadLatestDraw(true)}
              disabled={latestLoading}
            >
              {latestLoading ? "확인 중..." : "최신 당첨번호 비교"}
            </button>

            <button
              className="secondary"
              onClick={copyAllSaved}
              disabled={!savedPicks.length}
            >
              저장번호 전체 복사
            </button>

            <button
              className="secondary danger"
              onClick={clearSavedPicks}
              disabled={!savedPicks.length}
            >
              전체 삭제
            </button>
          </div>
        </div>

        {latestDraw ? (
          <div className="latest-compare-box">
            <div>
              <strong>{latestDraw.draw_no}회 최신 당첨번호</strong>
              <span>{latestDraw.draw_date}</span>
            </div>

            <Balls numbers={latestDraw.numbers} bonus={latestDraw.bonus ?? undefined} />
          </div>
        ) : (
          <div className="latest-compare-box muted-box">
            최신 당첨번호를 불러오는 중입니다.
          </div>
        )}

        {savedPicks.length === 0 ? (
          <div className="empty-box">
            아직 저장한 번호가 없습니다. 추천번호 카드에서 저장 버튼을 눌러보세요.
          </div>
        ) : (
          <div className="saved-list">
            {savedPicks.map((pick, index) => {
              const result = comparePick(pick.numbers, latestDraw);

              return (
                <div className="saved-item" key={pick.id}>
                  <div className="saved-main">
                    <div>
                      <strong>저장번호 {index + 1}</strong>
                      <span>
                        {methodLabels[pick.method]} ·{" "}
                        {new Date(pick.savedAt).toLocaleString("ko-KR")}
                      </span>
                    </div>

                    <Balls numbers={pick.numbers} />

                    <div className="match-summary">
                      <span className={`rank-badge ${result.rankClass}`}>
                        {result.rank}
                      </span>

                      <span>
                        일치 {result.matchCount}개
                        {result.bonusMatch ? " + 보너스 일치" : ""}
                      </span>

                      <span>
                        맞은 번호:{" "}
                        {result.matchedNumbers.length > 0
                          ? result.matchedNumbers.join(", ")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="saved-buttons">
                    <button
                      type="button"
                      className="copy-button"
                      onClick={() => copySavedPick(pick, index)}
                    >
                      복사
                    </button>

                    <button
                      type="button"
                      className="copy-button danger"
                      onClick={() => removeSavedPick(pick.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}