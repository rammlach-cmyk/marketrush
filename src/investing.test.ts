import { describe, expect, it } from "vitest";
import { createGame, migrateGame, tick, trade } from "./engine";
import {
  createInvesting,
  dailyChange,
  indexValue,
  netWorth,
  predictionValue,
  STOCK_INTERVAL,
  stockValue,
  toggleWatch,
  tradeStock,
  updateInvesting,
} from "./investing";
import { claimDaily, claimDayProfit } from "./wallet";
const now = 1800000000000;
function seeded(seed = 42) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
describe("five-minute exchange", () => {
  it("seeds 33 unique companies, every industry and meaningful history", () => {
    const s = createInvesting(now);
    expect(s.companies).toHaveLength(33);
    expect(new Set(s.companies.map((c) => c.ticker)).size).toBe(33);
    expect(new Set(s.companies.map((c) => c.industry)).size).toBe(13);
    expect(
      s.companies.every(
        (c) =>
          c.history[0].time <= now - 30 * 86400000 &&
          c.history.at(-1)!.price === c.price,
      ),
    ).toBe(true);
    expect(indexValue(s)).toBe(10000);
  });
  it("waits a full interval then updates all prices once and retains timer alignment", () => {
    const s = createInvesting(now);
    expect(updateInvesting(s, now + STOCK_INTERVAL - 1)).toBe(s);
    const next = updateInvesting(s, now + STOCK_INTERVAL, () => 0.5);
    expect(
      next.companies.every((c, i) => c.price !== s.companies[i].price),
    ).toBe(true);
    expect(next.lastUpdate).toBe(now + STOCK_INTERVAL);
    expect(next.indexHistory.at(-1)!.price).toBeCloseTo(indexValue(next));
    expect(updateInvesting(next, now + STOCK_INTERVAL + 1000)).toBe(next);
    expect(
      updateInvesting(s, now + STOCK_INTERVAL * 2 + 1200, () => 0.5).lastUpdate,
    ).toBe(now + STOCK_INTERVAL * 2);
  });
  it("uses growth, health, momentum, industry and sentiment instead of pure noise", () => {
    const base = createInvesting(now);
    const changed = {
      ...base,
      sentiment: 0.003,
      industries: { Technology: 0.003 },
      companies: base.companies.map((c) => ({
        ...c,
        momentum: 0.004,
        health: 0.9,
        growth: 0.003,
      })),
    };
    const a = updateInvesting(base, now + STOCK_INTERVAL, () => 0.5),
      b = updateInvesting(changed, now + STOCK_INTERVAL, () => 0.5);
    expect(b.companies[0].price).toBeGreaterThan(a.companies[0].price);
    expect(b.companies[0].momentum).toBeGreaterThan(0);
  });
  it("links major moves to news and applies temporary industry events", () => {
    let i = 0;
    const rng = () =>
      [0.01, 0, 0.5, ...Array(13).fill(0.5), 0.5, 0.5, 0.5][i++] ?? 0.5;
    const s = updateInvesting(createInvesting(now), now + STOCK_INTERVAL, rng);
    expect(s.events[0].name).toBe("TECH RALLY");
    expect(s.news[0].headline).toContain("TECH RALLY");
    const tech = s.companies.find((c) => c.ticker === "NOVA")!,
      sports = s.companies.find((c) => c.ticker === "TSPO")!;
    expect(tech.price / tech.initialPrice).toBeGreaterThan(
      sports.price / sports.initialPrice,
    );
    const expired = updateInvesting(s, now + STOCK_INTERVAL * 4, () => 0.5);
    expect(expired.events).toHaveLength(0);
  });
  it("catches up offline, persists the update boundary and bounds retained data", () => {
    const s = updateInvesting(createInvesting(now), now + 86400000, seeded());
    expect(s.lastUpdate).toBe(now + 86400000);
    expect(
      s.companies.every(
        (c) =>
          Number.isFinite(c.price) && c.price >= 0.5 && c.history.length < 1000,
      ),
    ).toBe(true);
    expect(s.indexHistory.length).toBeLessThan(1000);
    const resumed = JSON.parse(JSON.stringify(s));
    expect(updateInvesting(resumed, s.lastUpdate + 1000)).toBe(resumed);
    expect(Number.isFinite(dailyChange(s.companies[0], s.lastUpdate))).toBe(
      true,
    );
  });
  it("does not mutate original data", () => {
    const s = createInvesting(now),
      serialized = JSON.stringify(s);
    updateInvesting(s, now + STOCK_INTERVAL, seeded());
    expect(JSON.stringify(s)).toBe(serialized);
  });
});
describe("shared stock wallet", () => {
  it("buys fractional shares, averages entries, partially sells and records cash exactly", () => {
    let g = createGame(now);
    g = tradeStock(g, "NOVA", "buy", 12.5, now);
    expect(g.cash).toBeCloseTo(8946.875);
    expect(netWorth(g)).toBeCloseTo(10000);
    expect(g.transactions[0].amount).toBeCloseTo(-1053.125);
    g.investing.companies[0].price = 91.2;
    g = tradeStock(g, "NOVA", "sell", 2.5, now + 1);
    expect(g.investing.holdings[0].shares).toBe(10);
    expect(g.investing.trades[0].profit).toBeCloseTo(17.375);
    expect(g.cash).toBeCloseTo(9174.875);
    expect(netWorth(g)).toBeCloseTo(10086.875);
    g = tradeStock(g, "NOVA", "buy", 10, now + 2);
    expect(g.investing.holdings[0].average).toBeCloseTo(87.725);
  });
  it("sells all without leaving rounding dust", () => {
    let g = createGame(now);
    const max = Math.floor((g.cash / 84.25) * 10000) / 10000;
    g = tradeStock(g, "NOVA", "buy", max, now);
    expect(g.cash).toBeGreaterThanOrEqual(0);
    g = tradeStock(g, "NOVA", "sell", max, now + 1);
    expect(g.investing.holdings).toHaveLength(0);
    expect(g.cash).toBeCloseTo(10000);
  });
  it("rejects overdrafts, negative/nonfinite quantities, excessive precision and oversells", () => {
    const g = createGame(now);
    for (const n of [0, -1, NaN, Infinity, 0.00001, 100000])
      expect(() => tradeStock(g, "NOVA", "buy", n)).toThrow();
    expect(() => tradeStock(g, "NOVA", "sell", 1)).toThrow();
    expect(() => tradeStock(g, "BAD", "buy", 1)).toThrow();
  });
  it("values prediction positions and long-term shares without counting day principal", () => {
    let g = trade(createGame(now), "COMETS", "YES", "buy", 100, now);
    g = tradeStock(g, "NOVA", "buy", 10, now);
    expect(predictionValue(g)).toBeCloseTo(63);
    expect(stockValue(g)).toBeCloseTo(842.5);
    expect(netWorth(g)).toBeCloseTo(10100);
    expect(g.transactions.map((t) => t.label)).toContain("NOVA STOCK PURCHASE");
    expect(g.transactions.some((t) => t.label.includes("ACHIEVEMENT"))).toBe(
      true,
    );
  });
  it("favorites toggle without changing balances", () => {
    let g = createGame(now);
    g = toggleWatch(g, "NOVA");
    expect(g.investing.watchlist).toEqual(["NOVA"]);
    g = toggleWatch(g, "NOVA");
    expect(g.investing.watchlist).toEqual([]);
    expect(g.cash).toBe(10000);
  });
  it("shares a single daily bonus and allows settled day-profit transfer only once", () => {
    let g = claimDaily(createGame(now), now);
    expect(g.cash).toBe(10250);
    expect(() => claimDaily(g, now)).toThrow();
    g = { ...g, dayResult: 27430, dayCash: 27430 };
    g = claimDayProfit(g, now);
    expect(g.cash).toBe(12680);
    expect(g.dayCash).toBe(25000);
    expect(g.dayResult).toBe(27430);
    expect(() => claimDayProfit(g, now)).toThrow();
    expect(g.transactions[0].wallet).toBe("practice");
  });
});
describe("save compatibility", () => {
  it("loads a genuine original-format save without losing cash, trades or positions", () => {
    const old = JSON.parse(
      JSON.stringify(trade(createGame(now), "COMETS", "YES", "buy", 20, now)),
    );
    for (const key of [
      "schemaVersion",
      "investing",
      "arcade",
      "transactions",
      "transactionId",
      "initialWorth",
      "dailySnapshot",
      "dayProfitClaimed",
    ])
      delete old[key];
    const migrated = migrateGame(old, now);
    expect(migrated.cash).toBe(old.cash);
    expect(migrated.positions).toEqual(old.positions);
    expect(migrated.trades).toEqual(old.trades);
    expect(migrated.investing.companies).toHaveLength(33);
    expect(migrated.arcade.net).toBe(0);
    expect(migrated.initialWorth).toBeCloseTo(netWorth(migrated));
    expect(migrateGame(JSON.parse(JSON.stringify(migrated)), now).cash).toBe(
      old.cash,
    );
  });
  it("refreshing a current save retains wallets, holdings, watchlist, ledger and timer", () => {
    let g = tradeStock(createGame(now), "NOVA", "buy", 3.25, now);
    g = toggleWatch(g, "NOVA");
    const loaded = migrateGame(JSON.parse(JSON.stringify(g)), now + 1000);
    expect(loaded).toEqual(g);
    expect(tick(loaded, now + 1000, () => 0.5).cash).toBe(g.cash);
  });
});
