import { describe, expect, it } from "vitest";
import {
  blackjackAction,
  highLow,
  marketWheel,
  newDeck,
  recovery,
  roulette,
  score,
  slots,
  startBlackjack,
  WHEEL,
  type Card,
} from "./arcade";
import { createGame, migrateGame } from "./engine";
import { tradeStock } from "./investing";
const now = 1800000000000;
const cards = (...ranks: number[]): Card[] =>
  ranks.map((rank) => ({ rank, suit: "♠" }));
function hand(player: number[], dealer: number[], deck: number[], bet = 25) {
  let g = createGame(now);
  g.cash -= bet;
  g.arcade.blackjack = {
    player: cards(...player),
    dealer: cards(...dealer),
    deck: cards(...deck),
    bet,
    status: "playing",
    result: "",
  };
  return g;
}
describe("blackjack", () => {
  it("creates a 52-card deck with unique suits/ranks and handles soft aces", () => {
    expect(newDeck()).toHaveLength(52);
    expect(new Set(newDeck().map((c) => `${c.rank}${c.suit}`)).size).toBe(52);
    expect(score(cards(1, 1, 9))).toBe(21);
    expect(score(cards(1, 7))).toBe(18);
    expect(score(cards(13, 12, 2))).toBe(22);
  });
  it("deducts the wager once, saves an active hand and does not allow a second deal", () => {
    const g = startBlackjack(createGame(now), 25, () => 0.999, now);
    expect(g.cash).toBe(9975);
    expect(g.arcade.blackjack!.status).toBe("playing");
    expect(g.arcade.blackjack!.deck.length).toBe(48);
    const restored = migrateGame(JSON.parse(JSON.stringify(g)), now);
    expect(restored.arcade.blackjack).toEqual(g.arcade.blackjack);
    expect(() => startBlackjack(g, 25)).toThrow();
  });
  it("hits, handles busts and prevents repeating a settled payout", () => {
    const g = blackjackAction(hand([10, 7], [10, 7], [8]), "hit", now);
    expect(g.cash).toBe(9975);
    expect(g.arcade.blackjack!.status).toBe("done");
    expect(g.arcade.net).toBe(-25);
    expect(() => blackjackAction(g, "stand", now)).toThrow();
  });
  it("dealer draws to 17, wins pay 2x total, ties refund, losses pay zero", () => {
    const win = blackjackAction(hand([10, 9], [10, 6], [10]), "stand", now);
    expect(win.cash).toBe(10025);
    expect(win.arcade.net).toBe(25);
    expect(win.arcade.blackjack!.dealer).toHaveLength(3);
    expect(blackjackAction(hand([10, 8], [10, 8], []), "stand", now).cash).toBe(
      10000,
    );
    expect(blackjackAction(hand([10, 7], [10, 9], []), "stand", now).cash).toBe(
      9975,
    );
  });
  it("doubles down with a single final card and twice the wager", () => {
    const g = blackjackAction(hand([5, 6], [10, 7], [10]), "double", now);
    expect(g.arcade.blackjack!.bet).toBe(50);
    expect(g.cash).toBe(10050);
    expect(g.arcade.net).toBe(50);
    const poor = hand([5, 6], [10, 7], [10]);
    poor.cash = 10;
    expect(() => blackjackAction(poor, "double")).toThrow();
    expect(() =>
      blackjackAction(hand([2, 3, 4], [10, 7], [10]), "double"),
    ).toThrow();
  });
  it("natural blackjack is 3:2 and dealer naturals settle immediately", () => {
    let natural = false,
      dealerNatural = false,
      push = false;
    for (
      let seed = 1;
      seed < 12000 && !(natural && dealerNatural && push);
      seed++
    ) {
      let state = seed;
      const rng = () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
      };
      const g = startBlackjack(createGame(now), 20, rng, now);
      const h = g.arcade.blackjack!;
      if (score(h.player) === 21 && score(h.dealer) !== 21) {
        expect(g.cash).toBe(10030);
        natural = true;
      }
      if (score(h.dealer) === 21 && score(h.player) !== 21) {
        expect(g.cash).toBe(9980);
        dealerNatural = true;
      }
      if (score(h.player) === 21 && score(h.dealer) === 21) {
        expect(g.cash).toBe(10000);
        push = true;
      }
    }
    expect(natural && dealerNatural && push).toBe(true);
  });
});
describe("arcade payout accounting", () => {
  it("roulette pays exact numbers and categories; zero never wins odd/even/color", () => {
    const g = createGame(now);
    expect(roulette(g, 10, "number", 7, () => 7.1 / 37, now).cash).toBe(10350);
    expect(roulette(g, 10, "red", 0, () => 1.1 / 37, now).cash).toBe(10010);
    expect(roulette(g, 10, "black", 0, () => 2.1 / 37, now).cash).toBe(10010);
    expect(roulette(g, 10, "odd", 0, () => 3.1 / 37, now).cash).toBe(10010);
    expect(roulette(g, 10, "even", 0, () => 4.1 / 37, now).cash).toBe(10010);
    for (const choice of ["odd", "even", "red", "black"] as const)
      expect(roulette(g, 10, choice, 0, () => 0, now).cash).toBe(9990);
    expect(() => roulette(g, 10, "number", 37)).toThrow();
  });
  it("slots pay triples, pairs, and no matches according to visible rules", () => {
    const g = createGame(now);
    expect(slots(g, 10, () => 0, now).cash).toBe(10070);
    let i = 0;
    expect(slots(g, 10, () => [0, 0, 0.5][i++], now).cash).toBe(10005);
    i = 0;
    expect(slots(g, 10, () => [0, 0.3, 0.7][i++], now).cash).toBe(9990);
  });
  it("market wheel implements every weighted segment and net results", () => {
    let bound = 0;
    for (const s of WHEEL) {
      const g = marketWheel(
        createGame(now),
        100,
        () => (bound + s.weight / 2) / 100,
        now,
      );
      expect(g.arcade.last!.multiplier).toBe(s.value);
      expect(g.cash).toBe(9900 + 100 * s.value);
      expect(g.arcade.net).toBe(100 * (s.value - 1));
      bound += s.weight;
    }
    expect(bound).toBe(100);
  });
  it("high/low consumes cards, rewards streaks, refunds ties and resets on losses", () => {
    let g = createGame(now);
    g.arcade.highLow = {
      current: cards(5)[0],
      deck: cards(8, 2, 2),
      streak: 0,
    };
    g = highLow(g, 10, "higher", () => 0, now);
    expect(g.arcade.highLow.streak).toBe(1);
    expect(g.cash).toBe(10006);
    g = highLow(g, 10, "lower", () => 0, now + 1);
    expect(g.arcade.highLow.streak).toBe(2);
    expect(g.cash).toBe(10013);
    g = highLow(g, 10, "higher", () => 0, now + 2);
    expect(g.cash).toBe(10013);
    expect(g.arcade.highLow.streak).toBe(0);
    expect(g.arcade.highLow.deck).toHaveLength(0);
    g.arcade.highLow.deck = cards(1);
    g = highLow(g, 10, "higher", () => 0, now + 3);
    expect(g.cash).toBe(10003);
  });
  it("all games reject invalid wagers and overdrafts without changing input", () => {
    const g = createGame(now);
    const actions = [
      (n: number) => startBlackjack(g, n),
      (n: number) => roulette(g, n, "odd"),
      (n: number) => slots(g, n),
      (n: number) => marketWheel(g, n),
      (n: number) => highLow(g, n, "higher"),
    ];
    for (const action of actions)
      for (const n of [-1, 0, NaN, Infinity, 0.5, 1001, 1.001])
        expect(() => action(n)).toThrow();
    g.cash = 5;
    for (const action of actions) expect(() => action(10)).toThrow();
    expect(g.cash).toBe(5);
    expect(g.transactions).toHaveLength(0);
  });
  it("stock sales and casino payouts share cash and balance-linked transactions", () => {
    let g = tradeStock(createGame(now), "NOVA", "buy", 1, now);
    g = tradeStock(g, "NOVA", "sell", 1, now + 1);
    g = slots(g, 25, () => 0, now + 2);
    expect(g.cash).toBe(10175);
    expect(g.transactions.map((t) => t.label)).toEqual([
      "SLOTS PAYOUT",
      "SLOTS PLAY",
      "NOVA STOCK SALE",
      "NOVA STOCK PURCHASE",
    ]);
    expect(g.transactions[0].balance).toBe(g.cash);
    expect(g.transactions.reduce((sum, t) => sum + t.amount, 0)).toBe(
      g.cash - 10000,
    );
    expect(migrateGame(JSON.parse(JSON.stringify(g)), now + 3).cash).toBe(
      g.cash,
    );
  });
  it("permits free recovery only when broke and never during an active hand", () => {
    let g = createGame(now);
    g.cash = 0;
    g = recovery(g, now);
    expect(g.cash).toBe(1000);
    expect(g.transactions[0].label).toBe("FREE SIMULATION RECOVERY");
    expect(() => recovery(g)).toThrow();
    g.cash = 0;
    g.arcade.blackjack = {
      player: cards(8, 7),
      dealer: cards(10, 5),
      deck: cards(4),
      bet: 25,
      status: "playing",
      result: "",
    };
    expect(() => recovery(g)).toThrow();
  });
});
