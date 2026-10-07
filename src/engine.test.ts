import { describe, expect, it } from "vitest";
import {
  createGame,
  equity,
  positionValue,
  setLimits,
  startDay,
  tick,
  trade,
} from "./engine";
const now = 1800000000000;
describe("prediction accounting", () => {
  it("starts with separate fake wallets and populated markets", () => {
    const g = createGame(now);
    expect(g.cash).toBe(10000);
    expect(g.dayCash).toBe(25000);
    expect(g.assets.length).toBe(14);
  });
  it("averages entries, partially sells and realizes profit", () => {
    let g = createGame(now);
    g = trade(g, "COMETS", "YES", "buy", 100, now);
    expect(g.cash).toBeCloseTo(10037);
    g.assets[0].price = 0.7;
    g = trade(g, "COMETS", "YES", "buy", 100, now + 1);
    expect(g.positions[0].entry).toBeCloseTo(0.665);
    g = trade(g, "COMETS", "YES", "sell", 50, now + 2);
    expect(g.positions[0].qty).toBe(150);
    expect(g.trades[0].profit).toBeCloseTo(1.75);
    expect(equity(g, "prediction")).toBeCloseTo(10107);
  });
  it("prices NO as the complement and pays winning contracts exactly once", () => {
    let g = createGame(now);
    g = trade(g, "COMETS", "NO", "buy", 100, now);
    expect(g.positions[0].entry).toBeCloseTo(0.37);
    const cash = g.cash;
    g = tick(g, g.assets[0].expires, () => 0.99);
    expect(g.assets[0].result).toBe(false);
    expect(g.cash).toBe(cash + 100 + 300);
    expect(g.positions).toHaveLength(0);
    expect(g.trades[0].action).toBe("resolution");
    const settled = g.cash;
    g = tick(g, g.lastTick + 1000, () => 0.99);
    expect(g.cash).toBe(settled);
  });
  it("settles losing contracts for zero", () => {
    let g = trade(createGame(now), "COMETS", "YES", "buy", 100, now);
    const cash = g.cash;
    g = tick(g, g.assets[0].expires, () => 0.999);
    expect(g.cash).toBe(cash);
    expect(g.trades[0].profit).toBeCloseTo(-63);
  });
  it("rejects overdrafts, invalid quantities, wrong sides and overselling", () => {
    const g = createGame(now);
    for (const qty of [0, -1, 1.5, NaN, Infinity, 1000000])
      expect(() => trade(g, "COMETS", "YES", "buy", qty)).toThrow();
    expect(() => trade(g, "COMETS", "SHORT", "buy", 1)).toThrow();
    expect(() => trade(g, "COMETS", "YES", "sell", 1)).toThrow();
    expect(() => trade(g, "NOVA", "LONG", "buy", 1)).toThrow();
  });
});
describe("day trading", () => {
  it("reserves short collateral and returns collateral plus profit on cover", () => {
    let g = startDay(createGame(now), now);
    g = trade(g, "NOVA", "SHORT", "buy", 10, now);
    expect(g.dayCash).toBeCloseTo(24157.5);
    g.assets.find((a) => a.id === "NOVA")!.price = 70;
    expect(
      positionValue(
        g.positions[0],
        g.assets.find((a) => a.id === "NOVA")!,
      ),
    ).toBeCloseTo(985);
    g = trade(g, "NOVA", "SHORT", "sell", 10, now + 1);
    expect(g.dayCash).toBeCloseTo(25142.5);
    expect(g.trades[0].profit).toBeCloseTo(142.5);
    expect(g.positions).toHaveLength(0);
  });
  it("executes long stop-loss and short take-profit", () => {
    let g = startDay(createGame(now), now);
    g = trade(g, "NOVA", "LONG", "buy", 10, now);
    g = setLimits(g, "NOVA", "LONG", 80, 90);
    g.assets.find((a) => a.id === "NOVA")!.price = 79;
    g = tick(g, now + 1000, () => 0.5);
    expect(g.positions).toHaveLength(0);
    expect(g.trades[0].profit).toBeLessThan(0);
    g = trade(g, "APEX", "SHORT", "buy", 10, now + 1001);
    g = setLimits(g, "APEX", "SHORT", 150, 130);
    g.assets.find((a) => a.id === "APEX")!.price = 129;
    g = tick(g, now + 2000, () => 0.5);
    expect(g.positions).toHaveLength(0);
    expect(g.trades[0].profit).toBeGreaterThan(0);
  });
  it("rejects stops on the wrong side of the price", () => {
    let g = startDay(createGame(now), now);
    g = trade(g, "NOVA", "LONG", "buy", 1, now);
    expect(() => setLimits(g, "NOVA", "LONG", 90, 80)).toThrow();
  });
  it("closes all stock positions at the bell and resets only the stock wallet", () => {
    let g = startDay(createGame(now), now);
    g = trade(g, "NOVA", "LONG", "buy", 10, now);
    g = trade(g, "COMETS", "YES", "buy", 10, now);
    g = tick(g, now + 600001, () => 0.5);
    expect(g.positions.every((p) => p.asset !== "NOVA")).toBe(true);
    expect(g.dayResult).toBe(g.dayCash);
    expect(() => trade(g, "NOVA", "LONG", "buy", 1)).toThrow();
    const cash = g.cash;
    g = startDay(g, now + 700000);
    expect(g.dayCash).toBe(25000);
    expect(g.cash).toBe(cash);
    expect(g.dayResult).toBeNull();
  });
});
describe("simulation", () => {
  it("moves every second, has momentum at minute boundaries and bounds probabilities", () => {
    let g = createGame(now);
    const initial = g.assets[0].price;
    g = tick(g, now + 1000, () => 0.9);
    expect(g.assets[0].price).not.toBe(initial);
    g = tick(g, now + 60000, () => 0.9);
    expect(g.assets[0].momentum).toBeGreaterThan(0);
    for (let i = 2; i < 90; i++) g = tick(g, now + i * 60000, () => 0.9);
    expect(
      g.assets
        .filter((a) => a.kind === "prediction")
        .every((a) => a.price >= 0 && a.price <= 1),
    ).toBe(true);
  });
  it("awards achievements once", () => {
    let g = trade(createGame(now), "COMETS", "YES", "buy", 1, now);
    expect(g.rewards).toContain("First Trade");
    const cash = g.cash;
    g = trade(g, "COMETS", "YES", "buy", 1, now + 1);
    expect(g.cash).toBeCloseTo(cash - 0.63);
    expect(g.rewards.filter((r) => r === "First Trade")).toHaveLength(1);
  });
});
