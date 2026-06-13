export function Ball({ n }: { n: number }) {
  const cls = n <= 10 ? "b1" : n <= 20 ? "b2" : n <= 30 ? "b3" : n <= 40 ? "b4" : "b5";
  return <span className={`ball ${cls}`}>{String(n).padStart(2, "0")}</span>;
}

export function Balls({ numbers, bonus }: { numbers: number[]; bonus?: number | null }) {
  return (
    <div className="balls">
      {numbers.map((n) => <Ball key={n} n={n} />)}
      {bonus ? <><span className="muted">+</span><Ball n={bonus} /></> : null}
    </div>
  );
}
