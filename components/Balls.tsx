type BallsProps = {
  numbers: number[];
  bonus?: number | null;
};

function getBallClass(number: number) {
  if (number <= 10) return "ball-yellow";
  if (number <= 20) return "ball-blue";
  if (number <= 30) return "ball-red";
  if (number <= 40) return "ball-dark";
  return "ball-green";
}

function formatNumber(number: number) {
  return String(number).padStart(2, "0");
}

export function Balls({ numbers, bonus }: BallsProps) {
  return (
    <div className="lotto-balls">
      {numbers.map((number) => (
        <span
          key={number}
          className={`lotto-ball ${getBallClass(number)}`}
          aria-label={`번호 ${number}`}
        >
          {formatNumber(number)}
        </span>
      ))}

      {bonus ? (
        <>
          <span className="bonus-plus">+</span>
          <span className="lotto-ball ball-bonus" aria-label={`보너스 ${bonus}`}>
            {formatNumber(bonus)}
          </span>
        </>
      ) : null}
    </div>
  );
}