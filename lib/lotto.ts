import type { GeneratedSet, LottoDraw, PickMethod } from "@/types/lotto";

const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);

function safeWeight(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function sampleWeighted(items: number[], weights: number[], count: number) {
  const selected: number[] = [];
  let pool = [...items];
  let poolWeights = [...weights];
  while (selected.length < count && pool.length) {
    const total = poolWeights.reduce((a, b) => a + safeWeight(b), 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx += 1) {
      r -= safeWeight(poolWeights[idx]);
      if (r <= 0) break;
    }
    selected.push(pool[idx]);
    pool.splice(idx, 1);
    poolWeights.splice(idx, 1);
  }
  return selected.sort((a, b) => a - b);
}

export function getNumberStats(draws: LottoDraw[]) {
  const allCounts = new Map<number, number>();
  const recentCounts = new Map<number, number>();
  const lastSeen = new Map<number, number>();
  const latestNo = draws.length ? Math.max(...draws.map((d) => d.draw_no)) : 0;
  const recentDraws = draws.slice(-100);

  ALL_NUMBERS.forEach((n) => {
    allCounts.set(n, 0);
    recentCounts.set(n, 0);
    lastSeen.set(n, 9999);
  });

  for (const draw of draws) {
    for (const n of draw.numbers) {
      allCounts.set(n, (allCounts.get(n) ?? 0) + 1);
      lastSeen.set(n, latestNo - draw.draw_no);
    }
  }
  for (const draw of recentDraws) {
    for (const n of draw.numbers) {
      recentCounts.set(n, (recentCounts.get(n) ?? 0) + 1);
    }
  }

  return ALL_NUMBERS.map((number) => ({
    number,
    totalCount: allCounts.get(number) ?? 0,
    recent100Count: recentCounts.get(number) ?? 0,
    missingRounds: lastSeen.get(number) ?? 9999,
  }));
}

function analyze(numbers: number[], stats: ReturnType<typeof getNumberStats>) {
  const sum = numbers.reduce((a, b) => a + b, 0);
  const odd = numbers.filter((n) => n % 2 === 1).length;
  const even = 6 - odd;
  const low = numbers.filter((n) => n <= 22).length;
  const high = 6 - low;
  const consecutivePairs = numbers.filter((n, idx) => idx > 0 && n - numbers[idx - 1] === 1).length;
  const hot = [...stats].sort((a, b) => b.totalCount - a.totalCount).slice(0, 15).map((s) => s.number);
  const cold = [...stats].sort((a, b) => b.missingRounds - a.missingRounds).slice(0, 15).map((s) => s.number);
  return {
    sum,
    odd,
    even,
    low,
    high,
    consecutivePairs,
    hotCount: numbers.filter((n) => hot.includes(n)).length,
    coldCount: numbers.filter((n) => cold.includes(n)).length,
  };
}

function isBalanced(numbers: number[], stats: ReturnType<typeof getNumberStats>) {
  const a = analyze(numbers, stats);
  if (a.sum < 90 || a.sum > 190) return false;
  if (a.odd < 2 || a.odd > 4) return false;
  if (a.low < 2 || a.low > 4) return false;
  if (a.consecutivePairs > 2) return false;
  const endings = new Map<number, number>();
  for (const n of numbers) endings.set(n % 10, (endings.get(n % 10) ?? 0) + 1);
  if ([...endings.values()].some((v) => v >= 4)) return false;
  return true;
}

function methodWeights(method: PickMethod, stats: ReturnType<typeof getNumberStats>) {
  const maxTotal = Math.max(...stats.map((s) => s.totalCount), 1);
  const maxRecent = Math.max(...stats.map((s) => s.recent100Count), 1);
  const maxMissing = Math.max(...stats.map((s) => s.missingRounds), 1);
  return ALL_NUMBERS.map((number) => {
    const s = stats.find((x) => x.number === number)!;
    if (method === "hot") return 1 + (s.totalCount / maxTotal) * 8;
    if (method === "recent") return 1 + (s.recent100Count / maxRecent) * 8;
    if (method === "cold") return 1 + (s.missingRounds / maxMissing) * 8;
    if (method === "balanced") {
      return 1 + (s.totalCount / maxTotal) * 3 + (s.recent100Count / maxRecent) * 2 + (s.missingRounds / maxMissing) * 1.5;
    }
    return 1;
  });
}

function score(numbers: number[], method: PickMethod, stats: ReturnType<typeof getNumberStats>) {
  const a = analyze(numbers, stats);
  let value = 100;
  value -= Math.abs(140 - a.sum) * 0.4;
  value -= Math.abs(3 - a.odd) * 6;
  value -= Math.abs(3 - a.low) * 5;
  value -= Math.max(0, a.consecutivePairs - 1) * 8;
  if (method === "hot") value += a.hotCount * 5;
  if (method === "cold") value += a.coldCount * 5;
  if (method === "recent") value += numbers.reduce((acc, n) => acc + ((stats.find((s) => s.number === n)?.recent100Count ?? 0) / 10), 0);
  return Math.max(0, Math.round(value * 10) / 10);
}

export function generateLottoSet(draws: LottoDraw[], method: PickMethod = "balanced"): GeneratedSet {
  const stats = getNumberStats(draws);
  const weights = methodWeights(method, stats);
  let numbers = sampleWeighted(ALL_NUMBERS, weights, 6);

  if (method === "balanced") {
    for (let i = 0; i < 300; i += 1) {
      const candidate = sampleWeighted(ALL_NUMBERS, weights, 6);
      if (isBalanced(candidate, stats)) {
        numbers = candidate;
        break;
      }
    }
  }

  return {
    method,
    numbers,
    score: score(numbers, method, stats),
    analysis: analyze(numbers, stats),
  };
}

export function generateMany(draws: LottoDraw[], method: PickMethod, count = 5) {
  const seen = new Set<string>();
  const result: GeneratedSet[] = [];
  while (result.length < count && seen.size < 1000) {
    const generated = generateLottoSet(draws, method);
    const key = generated.numbers.join("-");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(generated);
    }
  }
  return result;
}

export function validateDrawInput(input: LottoDraw) {
  const errors: string[] = [];
  if (!Number.isInteger(input.draw_no) || input.draw_no < 1) errors.push("회차가 올바르지 않습니다.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.draw_date)) errors.push("추첨일은 YYYY-MM-DD 형식이어야 합니다.");
  if (!Array.isArray(input.numbers) || input.numbers.length !== 6) errors.push("당첨번호는 6개여야 합니다.");
  if (new Set(input.numbers).size !== 6) errors.push("당첨번호 6개는 중복될 수 없습니다.");
  if (input.numbers.some((n) => !Number.isInteger(n) || n < 1 || n > 45)) errors.push("당첨번호는 1~45 범위여야 합니다.");
  if (input.bonus !== null && input.bonus !== undefined) {
    if (!Number.isInteger(input.bonus) || input.bonus < 1 || input.bonus > 45) errors.push("보너스 번호는 1~45 범위여야 합니다.");
    if (input.numbers.includes(input.bonus)) errors.push("보너스 번호는 당첨번호와 중복될 수 없습니다.");
  }
  return errors;
}
