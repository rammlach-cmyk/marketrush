import type { Game } from "./engine";
import { netWorth } from "./investing";
import { walletChange } from "./wallet";
export type Card = { rank: number; suit: string };
export type Blackjack = {
  player: Card[];
  dealer: Card[];
  deck: Card[];
  bet: number;
  status: "playing" | "done";
  result: string;
};
export type ArcadeResult = {
  game: string;
  message: string;
  wager: number;
  payout: number;
  time: number;
  symbols?: string[];
  number?: number;
  multiplier?: number;
  card?: Card;
};
export type Arcade = {
  blackjack: Blackjack | null;
  highLow: { current: Card; deck: Card[]; streak: number };
  last: ArcadeResult | null;
  net: number;
  plays: number;
};
export const SYMBOLS = ["📈", "💰", "🚀", "💎", "🏆", "🔥"];
export const WHEEL = [
  { value: 0, weight: 38 },
  { value: 0.5, weight: 22 },
  { value: 1, weight: 20 },
  { value: 1.25, weight: 8 },
  { value: 1.5, weight: 6 },
  { value: 2, weight: 4 },
  { value: 3, weight: 2 },
];
export const RED = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);
export function newDeck(random = Math.random): Card[] {
  const deck = ["♠", "♥", "♦", "♣"].flatMap((suit) =>
    Array.from({ length: 13 }, (_, i) => ({ rank: i + 1, suit })),
  );
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export function createArcade(): Arcade {
  const deck = newDeck(() => 0.5);
  return {
    blackjack: null,
    highLow: { current: deck.pop()!, deck, streak: 0 },
    last: null,
    net: 0,
    plays: 0,
  };
}
export function cardLabel(card: Card) {
  return `${card.rank === 1 ? "A" : card.rank === 11 ? "J" : card.rank === 12 ? "Q" : card.rank === 13 ? "K" : card.rank}${card.suit}`;
}
export function score(cards: Card[]) {
  let sum = cards.reduce(
      (s, c) => s + (c.rank === 1 ? 11 : Math.min(10, c.rank)),
      0,
    ),
    aces = cards.filter((c) => c.rank === 1).length;
  while (sum > 21 && aces-- > 0) sum -= 10;
  return sum;
}
function checkWager(g: Game, wager: number) {
  if (
    !Number.isFinite(wager) ||
    wager < 1 ||
    wager > 1000 ||
    Math.abs(Math.round(wager * 100) - wager * 100) > 1e-6
  )
    throw Error(
      "Choose a play amount from 1 to 1,000 MC, with up to two decimals.",
    );
  if (wager > g.cash + 1e-8) throw Error("Not enough Market Cash.");
}
function settle(g: Game, result: ArcadeResult): Game {
  const next = walletChange(
    g,
    result.payout,
    `${result.game.toUpperCase()} PAYOUT`,
    result.time,
  );
  return {
    ...next,
    arcade: {
      ...g.arcade,
      last: result,
      net: g.arcade.net + result.payout - result.wager,
      plays: g.arcade.plays + 1,
    },
  };
}
export function startBlackjack(
  g: Game,
  wager: number,
  random = Math.random,
  now = Date.now(),
): Game {
  if (g.arcade.blackjack?.status === "playing")
    throw Error("Finish your current blackjack hand.");
  checkWager(g, wager);
  const deck = newDeck(random),
    player = [deck.pop()!, deck.pop()!],
    dealer = [deck.pop()!, deck.pop()!];
  let next = walletChange(g, -wager, "BLACKJACK WAGER", now);
  next = {
    ...next,
    arcade: {
      ...next.arcade,
      blackjack: {
        player,
        dealer,
        deck,
        bet: wager,
        status: "playing",
        result: "Your move. Hit, stand, or double down.",
      },
    },
  };
  if (score(player) === 21 || score(dealer) === 21) {
    const payout =
      score(player) === 21 ? (score(dealer) === 21 ? wager : wager * 2.5) : 0;
    const message =
      score(player) === 21
        ? score(dealer) === 21
          ? "Both blackjack. Push."
          : "Blackjack! Natural pays 3:2."
        : "Dealer blackjack.";
    return finishBlackjack(next, payout, message, now);
  }
  return next;
}
function finishBlackjack(
  g: Game,
  payout: number,
  message: string,
  now: number,
): Game {
  const hand = g.arcade.blackjack!;
  return settle(
    {
      ...g,
      arcade: {
        ...g.arcade,
        blackjack: { ...hand, status: "done", result: message },
      },
    },
    { game: "Blackjack", message, wager: hand.bet, payout, time: now },
  );
}
export function blackjackAction(
  g: Game,
  action: "hit" | "stand" | "double",
  now = Date.now(),
): Game {
  const original = g.arcade.blackjack;
  if (!original || original.status !== "playing")
    throw Error("Deal a new hand first.");
  let hand = {
      ...original,
      player: [...original.player],
      dealer: [...original.dealer],
      deck: [...original.deck],
    },
    next = g;
  if (action === "double") {
    if (hand.player.length !== 2)
      throw Error("Double down is only available on your first decision.");
    if (hand.bet > g.cash)
      throw Error("Not enough Market Cash to double down.");
    next = walletChange(g, -hand.bet, "BLACKJACK DOUBLE DOWN", now);
    hand.bet *= 2;
  }
  if (action !== "stand") {
    hand.player.push(hand.deck.pop()!);
    next = { ...next, arcade: { ...next.arcade, blackjack: hand } };
    if (score(hand.player) > 21)
      return finishBlackjack(next, 0, "Bust. Dealer wins.", now);
    if (action === "hit" && score(hand.player) < 21) return next;
  }
  while (score(hand.dealer) < 17) hand.dealer.push(hand.deck.pop()!);
  next = { ...next, arcade: { ...next.arcade, blackjack: hand } };
  const player = score(hand.player),
    dealer = score(hand.dealer),
    win = dealer > 21 || player > dealer,
    push = player === dealer;
  return finishBlackjack(
    next,
    win ? hand.bet * 2 : push ? hand.bet : 0,
    win ? "You win!" : push ? "Push. Play amount returned." : "Dealer wins.",
    now,
  );
}
export type RouletteChoice = "number" | "odd" | "even" | "red" | "black";
export function roulette(
  g: Game,
  wager: number,
  choice: RouletteChoice,
  number = 0,
  random = Math.random,
  now = Date.now(),
): Game {
  checkWager(g, wager);
  if (!["number", "odd", "even", "red", "black"].includes(choice))
    throw Error("Choose a valid wheel category.");
  if (
    choice === "number" &&
    (!Number.isInteger(number) || number < 0 || number > 36)
  )
    throw Error("Choose a number from 0 to 36.");
  const result = Math.floor(random() * 37);
  const win =
    choice === "number"
      ? result === number
      : result !== 0 &&
        (choice === "odd"
          ? result % 2 === 1
          : choice === "even"
            ? result % 2 === 0
            : choice === "red"
              ? RED.has(result)
              : !RED.has(result));
  const payout = win ? wager * (choice === "number" ? 36 : 2) : 0;
  return settle(walletChange(g, -wager, "ROULETTE WAGER", now), {
    game: "Roulette",
    message: `${result} · ${result === 0 ? "green" : RED.has(result) ? "red" : "black"} — ${win ? "you win!" : "try another play."}`,
    wager,
    payout,
    time: now,
    number: result,
  });
}
export function slots(
  g: Game,
  wager: number,
  random = Math.random,
  now = Date.now(),
): Game {
  checkWager(g, wager);
  const symbols = Array.from(
    { length: 3 },
    () => SYMBOLS[Math.floor(random() * SYMBOLS.length)],
  );
  const count = new Set(symbols).size;
  const multiplier = count === 1 ? 8 : count === 2 ? 1.5 : 0;
  return settle(walletChange(g, -wager, "SLOTS PLAY", now), {
    game: "Slots",
    message:
      count === 1
        ? "Triple match! 8× payout."
        : count === 2
          ? "Pair! 1.5× payout."
          : "No match. Next spin, new story.",
    wager,
    payout: wager * multiplier,
    time: now,
    symbols,
    multiplier,
  });
}
export function marketWheel(
  g: Game,
  wager: number,
  random = Math.random,
  now = Date.now(),
): Game {
  checkWager(g, wager);
  let pick = random() * 100;
  let multiplier = 0;
  for (const segment of WHEEL) {
    pick -= segment.weight;
    if (pick < 0) {
      multiplier = segment.value;
      break;
    }
  }
  return settle(walletChange(g, -wager, "MARKET WHEEL PLAY", now), {
    game: "Market Wheel",
    message: `Landed on ${multiplier}×.`,
    wager,
    payout: wager * multiplier,
    time: now,
    multiplier,
  });
}
export function highLow(
  g: Game,
  wager: number,
  choice: "higher" | "lower",
  random = Math.random,
  now = Date.now(),
): Game {
  checkWager(g, wager);
  if (!["higher", "lower"].includes(choice))
    throw Error("Choose higher or lower.");
  const previous = g.arcade.highLow;
  const deck = previous.deck.length ? [...previous.deck] : newDeck(random);
  const index = Math.floor(random() * deck.length);
  const [card] = deck.splice(index, 1);
  const tie = card.rank === previous.current.rank;
  const win =
    choice === "higher"
      ? card.rank > previous.current.rank
      : card.rank < previous.current.rank;
  const streak = win ? previous.streak + 1 : 0,
    multiplier = win ? 1.5 + Math.min(streak, 5) * 0.1 : tie ? 1 : 0;
  let next = walletChange(g, -wager, "HIGH / LOW PLAY", now);
  next = {
    ...next,
    arcade: { ...next.arcade, highLow: { current: card, deck, streak } },
  };
  return settle(next, {
    game: "High / Low",
    message: tie
      ? "Same rank. Play amount returned; streak reset."
      : win
        ? `${choice} was right! ${streak}-win streak · ${multiplier.toFixed(1)}× payout.`
        : "Missed it. Streak reset.",
    wager,
    payout: wager * multiplier,
    time: now,
    card,
    multiplier,
  });
}
export function recovery(g: Game, now = Date.now()): Game {
  if (netWorth(g) >= 1 || g.arcade.blackjack?.status === "playing")
    throw Error(
      "Recovery unlocks when shared net worth is below 1 MC and no hand is active.",
    );
  return walletChange(g, 1000, "FREE SIMULATION RECOVERY", now);
}
