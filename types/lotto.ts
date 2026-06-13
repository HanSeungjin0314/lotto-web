export type LottoDraw = {
  id?: number;
  draw_no: number;
  draw_date: string;
  numbers: number[];
  bonus: number | null;
  first_prize_amount?: string | number | null;
  first_winner_count?: number | null;
  created_at?: string;
};

export type PickMethod = "balanced" | "hot" | "cold" | "recent" | "random";

export type GeneratedSet = {
  method: PickMethod;
  numbers: number[];
  score: number;
  analysis: {
    sum: number;
    odd: number;
    even: number;
    low: number;
    high: number;
    consecutivePairs: number;
    hotCount: number;
    coldCount: number;
  };
};
