import type { Game } from "./engine";
export type Transaction = {
  id: number;
  time: number;
  label: string;
  amount: number;
  balance: number;
  wallet: "shared" | "practice";
};
export type DaySnapshot = { date: string; value: number };
export function recordTransaction(
  g: Game,
  amount: number,
  label: string,
  wallet: Transaction["wallet"] = "shared",
  now = Date.now(),
): Game {
  const id = g.transactionId + 1;
  return {
    ...g,
    transactionId: id,
    transactions: [
      {
        id,
        time: now,
        label,
        amount,
        balance: wallet === "shared" ? g.cash : g.dayCash,
        wallet,
      },
      ...g.transactions,
    ].slice(0, 1000),
  };
}
export function walletChange(
  g: Game,
  amount: number,
  label: string,
  now = Date.now(),
): Game {
  if (!Number.isFinite(amount) || g.cash + amount < -1e-7)
    throw Error("Not enough Market Cash.");
  return recordTransaction(
    { ...g, cash: Math.max(0, g.cash + amount) },
    amount,
    label,
    "shared",
    now,
  );
}
export function claimDaily(g: Game, now = Date.now()): Game {
  const date = new Date(now).toDateString();
  if (g.bonusDate === date) throw Error("Daily bonus already claimed.");
  return walletChange(
    { ...g, bonusDate: date },
    250,
    "DAILY MARKET CASH BONUS",
    now,
  );
}
export function claimDayProfit(g: Game, now = Date.now()): Game {
  if (g.dayResult === null || g.dayResult <= 25000 || g.dayProfitClaimed)
    throw Error("No unclaimed settled day-trading profit.");
  const amount = g.dayResult - 25000;
  // Principal remains a separate resettable practice balance. Only settled profit can transfer once.
  const next = walletChange(
    { ...g, dayProfitClaimed: true, dayCash: g.dayCash - amount },
    amount,
    "DAY TRADING PROFIT TRANSFER",
    now,
  );
  return recordTransaction(
    next,
    -amount,
    "PROFIT TRANSFER TO SHARED WALLET",
    "practice",
    now,
  );
}
