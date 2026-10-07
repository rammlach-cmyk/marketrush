import { createArcade, type Arcade } from "./arcade";
import {
  createInvesting,
  netWorth,
  updateInvesting,
  type Investing,
} from "./investing";
import {
  claimDayProfit,
  recordTransaction,
  walletChange,
  type DaySnapshot,
  type Transaction,
} from "./wallet";
export type Point = { time: number; price: number };
export type Asset = {
  id: string;
  name: string;
  symbol: string;
  category: string;
  kind: "prediction" | "stock";
  price: number;
  anchor: number;
  momentum: number;
  history: Point[];
  expires: number;
  resolved?: boolean;
  result?: boolean;
  volume: number;
  traders: number;
  color: string;
};
export type Position = {
  asset: string;
  side: "YES" | "NO" | "LONG" | "SHORT";
  qty: number;
  entry: number;
  stop?: number;
  take?: number;
};
export type Trade = {
  id: string;
  asset: string;
  side: Position["side"];
  action: string;
  qty: number;
  price: number;
  time: number;
  profit: number;
};
export type News = {
  id: string;
  asset: string;
  headline: string;
  time: number;
  impact: number;
};
export type Game = {
  version: 1;
  schemaVersion: 2;
  investing: Investing;
  arcade: Arcade;
  transactions: Transaction[];
  transactionId: number;
  initialWorth: number;
  dailySnapshot: DaySnapshot;
  dayProfitClaimed: boolean;
  cash: number;
  dayCash: number;
  assets: Asset[];
  positions: Position[];
  trades: Trade[];
  news: News[];
  lastTick: number;
  dayStart: number | null;
  dayEnd: number | null;
  dayResult: number | null;
  bonusDate: string;
  username: string;
  rewards: string[];
};
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const seeds: [string, string, string, number, string][] = [
  ["Will the Comets win tonight?", "COMETS", "Sports", 0.63, "#a78bfa"],
  ["Will the final have 5+ goals?", "GOALS", "Sports", 0.38, "#38bdf8"],
  ["Will Jax Rivera score?", "RIVERA", "Sports", 0.72, "#fbbf24"],
  [
    "Will the Wolves take the championship?",
    "WOLVES",
    "Sports",
    0.46,
    "#fb7185",
  ],
  ["Will Neon Horizon debut at #1?", "NEON", "Pop culture", 0.58, "#f472b6"],
  [
    "Will Luna release a surprise single?",
    "LUNA",
    "Pop culture",
    0.31,
    "#c084fc",
  ],
  ["Will the Aurora festival sell out?", "AURORA", "Events", 0.81, "#2dd4bf"],
  ["Will Atlas launch before Friday?", "ATLAS", "Events", 0.54, "#60a5fa"],
];
export function createGame(now = Date.now()): Game {
  const assets: Asset[] = seeds.map(
    ([name, symbol, category, price, color], i) => ({
      id: symbol,
      name,
      symbol,
      category,
      price,
      anchor: price,
      momentum: 0,
      kind: "prediction",
      expires: now + (i + 2) * 180000,
      volume: 42000 + i * 16341,
      traders: 132 + i * 47,
      color,
      history: Array.from({ length: 61 }, (_, j) => ({
        time: now - (60 - j) * 60000,
        price: clamp(
          price + Math.sin(j * 0.35 + i) * 0.035 * (1 - j / 60),
          0.02,
          0.98,
        ),
      })),
    }),
  );
  [
    ["NOVA TECH", "NOVA", 84.25],
    ["APEX MOTORS", "APEX", 142.6],
    ["SKYLINE AI", "SKY", 218.4],
    ["TITAN SPORTS", "TITAN", 56.8],
    ["ORBIT ENERGY", "ORBIT", 103.2],
    ["PULSE MEDIA", "PULSE", 32.45],
  ].forEach(([name, symbol, price], i) =>
    assets.push({
      id: String(symbol),
      name: String(name),
      symbol: String(symbol),
      category: "Stocks",
      kind: "stock",
      price: Number(price),
      anchor: Number(price),
      momentum: 0,
      expires: 0,
      volume: 800000 + i * 23451,
      traders: 345 + i * 71,
      color: ["#a78bfa", "#38bdf8", "#2dd4bf", "#fbbf24", "#fb7185", "#f472b6"][
        i
      ],
      history: [{ time: now, price: Number(price) }],
    }),
  );
  return {
    version: 1,
    schemaVersion: 2,
    investing: createInvesting(now),
    arcade: createArcade(),
    transactions: [],
    transactionId: 0,
    initialWorth: 10000,
    dailySnapshot: { date: new Date(now).toDateString(), value: 10000 },
    dayProfitClaimed: false,
    cash: 10000,
    dayCash: 25000,
    assets,
    positions: [],
    trades: [],
    news: [
      {
        id: "welcome",
        asset: "COMETS",
        headline: "Comets enter the arena with a five-game winning streak.",
        time: now,
        impact: 0,
      },
    ],
    lastTick: now,
    dayStart: null,
    dayEnd: null,
    dayResult: null,
    bonusDate: "",
    username: "You",
    rewards: [],
  };
}
export const quote = (a: Asset, side: Position["side"]) =>
  side === "NO" ? 1 - a.price : a.price;
export function positionValue(p: Position, a: Asset) {
  return (
    p.qty * (p.side === "SHORT" ? 2 * p.entry - a.price : quote(a, p.side))
  );
}
export function equity(g: Game, kind: Asset["kind"]) {
  return (
    (kind === "stock" ? g.dayCash : g.cash) +
    g.positions
      .filter((p) => g.assets.find((a) => a.id === p.asset)?.kind === kind)
      .reduce(
        (s, p) =>
          s +
          positionValue(
            p,
            g.assets.find((a) => a.id === p.asset)!,
          ),
        0,
      )
  );
}
export function trade(
  g: Game,
  id: string,
  side: Position["side"],
  action: "buy" | "sell",
  qty: number,
  now = Date.now(),
): Game {
  const a = g.assets.find((x) => x.id === id);
  if (!a || !Number.isSafeInteger(qty) || qty <= 0)
    throw Error("Enter a positive whole number.");
  if (a.resolved) throw Error("This market has resolved.");
  if (a.kind === "stock" && (!g.dayStart || g.dayResult !== null))
    throw Error("Start a trading day first.");
  if (
    a.kind === "stock"
      ? !["LONG", "SHORT"].includes(side)
      : !["YES", "NO"].includes(side)
  )
    throw Error("Invalid order side.");
  const price = quote(a, side),
    key = a.kind === "stock" ? "dayCash" : "cash";
  const existing = g.positions.find((p) => p.asset === id && p.side === side);
  let cash = g[key],
    profit = 0,
    positions = g.positions.map((p) => ({ ...p }));
  if (action === "buy") {
    if (price * qty > cash + 1e-8) throw Error("Not enough Market Cash.");
    cash -= price * qty;
    if (existing)
      positions = positions.map((p) =>
        p.asset === id && p.side === side
          ? {
              ...p,
              qty: p.qty + qty,
              entry: (p.qty * p.entry + qty * price) / (p.qty + qty),
            }
          : p,
      );
    else positions.push({ asset: id, side, qty, entry: price });
  } else {
    if (!existing || qty > existing.qty)
      throw Error("You do not own that many contracts or shares.");
    const value = side === "SHORT" ? 2 * existing.entry - price : price;
    cash += qty * value;
    profit =
      (side === "SHORT" ? existing.entry - price : price - existing.entry) *
      qty;
    positions = positions
      .map((p) =>
        p.asset === id && p.side === side ? { ...p, qty: p.qty - qty } : p,
      )
      .filter((p) => p.qty > 0);
  }
  return reward(
    recordTransaction(
      {
        ...g,
        [key]: cash,
        positions,
        trades: [
          {
            id: `${now}-${g.trades.length}`,
            asset: id,
            side,
            action,
            qty,
            price,
            time: now,
            profit,
          },
          ...g.trades,
        ].slice(0, 2000),
      },
      cash - g[key],
      `${a.kind === "stock" ? "DAY TRADING" : "PREDICTION MARKET"} ${id} ${action.toUpperCase()}`,
      a.kind === "stock" ? "practice" : "shared",
      now,
    ),
  );
}
export function reward(g: Game): Game {
  const wins = g.trades.filter((t) => t.profit > 0).length;
  const conditions: [string, boolean, number][] = [
    ["First Trade", g.trades.length > 0, 100],
    ["5 Trades Won", wins >= 5, 250],
    ["+$1,000 Profit", g.trades.reduce((s, t) => s + t.profit, 0) >= 1000, 500],
    ["$50,000 Portfolio", equity(g, "prediction") >= 50000, 1000],
    [
      "10 Trades in One Day",
      g.trades.filter(
        (t) =>
          new Date(t.time).toDateString() ===
          new Date(g.lastTick).toDateString(),
      ).length >= 10,
      200,
    ],
    [
      "Perfect Prediction",
      g.trades.some((t) => t.action === "resolution" && t.profit > 0),
      300,
    ],
  ];
  for (const [name, ok, amount] of conditions)
    if (ok && !g.rewards.includes(name))
      g = walletChange(
        { ...g, rewards: [...g.rewards, name] },
        amount,
        `ACHIEVEMENT: ${name}`,
        g.lastTick,
      );
  return g;
}
export function startDay(g: Game, now = Date.now()): Game {
  if (g.dayStart && g.dayResult === null) return g;
  if (g.dayResult !== null && g.dayResult > 25000 && !g.dayProfitClaimed)
    g = claimDayProfit(g, now);
  return recordTransaction(
    {
      ...g,
      dayCash: 25000,
      dayProfitClaimed: false,
      dayStart: now,
      dayEnd: now + 600000,
      dayResult: null,
      positions: g.positions.filter(
        (p) => g.assets.find((a) => a.id === p.asset)?.kind !== "stock",
      ),
      assets: g.assets.map((a) =>
        a.kind === "stock"
          ? {
              ...a,
              price: a.anchor,
              momentum: 0,
              history: [{ time: now, price: a.anchor }],
            }
          : a,
      ),
    },
    25000 - g.dayCash,
    "DAY PRACTICE SESSION START",
    "practice",
    now,
  );
}
export function setLimits(
  g: Game,
  id: string,
  side: Position["side"],
  stop?: number,
  take?: number,
): Game {
  const a = g.assets.find((a) => a.id === id)!,
    p = g.positions.find((p) => p.asset === id && p.side === side);
  if (!p) throw Error("Open a position first.");
  if (
    (stop !== undefined && (!Number.isFinite(stop) || stop <= 0)) ||
    (take !== undefined && (!Number.isFinite(take) || take <= 0))
  )
    throw Error("Use positive price levels.");
  const short = side === "SHORT";
  if (stop !== undefined && (short ? stop <= a.price : stop >= a.price))
    throw Error("Stop-loss must be on the loss side of the current price.");
  if (take !== undefined && (short ? take >= a.price : take <= a.price))
    throw Error("Take-profit must be on the profit side of the current price.");
  return {
    ...g,
    positions: g.positions.map((x) =>
      x.asset === id && x.side === side ? { ...x, stop, take } : x,
    ),
  };
}
export function tick(
  original: Game,
  now = Date.now(),
  random = Math.random,
): Game {
  if (now <= original.lastTick) return original;
  let g = {
    ...original,
    assets: original.assets.map((a) => ({ ...a, history: [...a.history] })),
    news: [...original.news],
    lastTick: now,
  };
  const minute =
      Math.floor(now / 60000) > Math.floor(original.lastTick / 60000),
    dt = Math.min(5, (now - original.lastTick) / 1000);
  for (const a of g.assets) {
    if (
      a.resolved ||
      (a.kind === "stock" && (!g.dayStart || g.dayResult !== null))
    )
      continue;
    if (a.kind === "prediction" && now >= a.expires) {
      a.resolved = true;
      a.result = random() < a.price;
      a.price = a.result ? 1 : 0;
      for (const p of g.positions.filter((p) => p.asset === a.id)) {
        const value = quote(a, p.side) * p.qty;
        g.cash += value;
        g = recordTransaction(
          g,
          value,
          `PREDICTION MARKET ${a.id} RESOLUTION`,
          "shared",
          now,
        );
        g.trades = [
          {
            id: `resolve-${a.id}-${p.side}`,
            asset: a.id,
            side: p.side,
            action: "resolution",
            qty: p.qty,
            price: quote(a, p.side),
            time: now,
            profit: value - p.qty * p.entry,
          },
          ...g.trades,
        ];
      }
      g.positions = g.positions.filter((p) => p.asset !== a.id);
      g.news.unshift({
        id: `resolved-${a.id}`,
        asset: a.id,
        headline: `Market resolved: ${a.result ? "YES" : "NO"} wins. Contracts settled automatically.`,
        time: now,
        impact: 0,
      });
    } else {
      const stock = a.kind === "stock";
      const phase = g.dayStart ? (now - g.dayStart) / 600000 : 0;
      const activity = (random() - 0.5) * 2;
      const volatility = stock ? (phase < 0.2 || phase > 0.75 ? 1.7 : 0.65) : 1;
      if (minute) {
        const news =
          random() < 0.3 ? (random() - 0.5) * (stock ? 0.12 : 0.18) : 0;
        const timePressure = stock
          ? 0
          : (1 - Math.min(1, (a.expires - now) / 1800000)) *
            (a.price - 0.5) *
            0.02;
        a.momentum =
          a.momentum * 0.6 +
          activity * (stock ? 0.018 : 0.045) +
          news +
          timePressure +
          (stock
            ? ((a.anchor - a.price) / a.anchor) * 0.008
            : (0.5 - a.price) * 0.012);
        a.price = stock
          ? Math.max(1, a.price * (1 + a.momentum * volatility))
          : clamp(a.price + a.momentum, 0.02, 0.98);
        if (news)
          g.news.unshift({
            id: `${now}-${a.id}`,
            asset: a.id,
            headline: stock
              ? news > 0
                ? [
                    "Earnings surprise beats fictional forecasts.",
                    "New product announcement excites traders.",
                    "Major partnership announced.",
                    "Fictional analyst upgrade lifts sentiment.",
                    "Viral product sends demand soaring.",
                    "Major contract announced.",
                  ][Math.floor(random() * 6)]
                : [
                    "CEO resignation shakes confidence.",
                    "Fictional analyst downgrade sparks selling.",
                    "Supply shortage shakes confidence.",
                    "Fictional lawsuit weighs on sentiment.",
                    "Market panic triggers a sell-off.",
                  ][Math.floor(random() * 5)]
              : news > 0
                ? "Fresh fictional reports boost confidence in YES."
                : "Unexpected fictional update sends YES lower.",
            time: now,
            impact: news,
          });
        a.volume += Math.round(random() * 15000);
        a.traders += Math.floor(random() * 8);
      } else {
        a.price = stock
          ? Math.max(
              1,
              a.price *
                (1 +
                  (a.momentum * 0.025 + (random() - 0.5) * 0.0015) *
                    volatility *
                    dt),
            )
          : clamp(
              a.price + (a.momentum * 0.008 + (random() - 0.5) * 0.001) * dt,
              0.02,
              0.98,
            );
      }
    }
    a.history.push({ time: now, price: a.price });
    a.history = a.history.filter((p) => p.time >= now - 3600000).slice(-4000);
  }
  for (const p of [...g.positions]) {
    const a = g.assets.find((a) => a.id === p.asset)!;
    if (a.kind !== "stock") continue;
    const short = p.side === "SHORT";
    const triggered =
      (p.stop !== undefined &&
        (short ? a.price >= p.stop : a.price <= p.stop)) ||
      (p.take !== undefined &&
        (short ? a.price <= p.take : a.price >= p.take)) ||
      positionValue(p, a) <= 0;
    if (triggered) g = trade(g, p.asset, p.side, "sell", p.qty, now);
  }
  if (g.dayEnd && now >= g.dayEnd && g.dayResult === null) {
    for (const p of [...g.positions])
      if (g.assets.find((a) => a.id === p.asset)?.kind === "stock")
        g = trade(g, p.asset, p.side, "sell", p.qty, now);
    g.dayResult = g.dayCash;
  }
  const date = new Date(now).toDateString();
  const dailySnapshot =
    original.dailySnapshot.date === date
      ? original.dailySnapshot
      : { date, value: netWorth(original) };
  return reward({
    ...g,
    dailySnapshot,
    investing: updateInvesting(g.investing, now, random),
    news: g.news.slice(0, 40),
  });
}
export function loadGame(): Game {
  try {
    const raw = localStorage.getItem("marketrush-v1");
    if (raw) {
      const g = JSON.parse(raw);
      if (
        g.version === 1 &&
        Array.isArray(g.assets) &&
        Array.isArray(g.positions) &&
        Number.isFinite(g.cash) &&
        Number.isFinite(g.dayCash)
      )
        return tick(migrateGame(g));
    }
  } catch {
    /* Start safely when a save is unavailable. */
  }
  return createGame();
}
export function change(a: Asset, minutes: number) {
  const target = Date.now() - minutes * 60000;
  const p = a.history.find((p) => p.time >= target) || a.history[0];
  return p
    ? ((a.price - p.price) / (a.kind === "stock" ? p.price : 1)) * 100
    : 0;
}

/** Open a new prediction round without resetting either wallet or trade history. */
export function restartPredictions(g: Game, now = Date.now()): Game {
  if (g.assets.some((a) => a.kind === "prediction" && !a.resolved))
    throw Error(
      "Wait for every prediction to resolve before opening a new round.",
    );
  return {
    ...g,
    assets: [
      ...createGame(now).assets.filter((a) => a.kind === "prediction"),
      ...g.assets.filter((a) => a.kind === "stock"),
    ],
    news: [
      {
        id: `round-${now}`,
        asset: "MARKETS",
        headline:
          "A fresh prediction round is open. Your Market Cash carries forward.",
        time: now,
        impact: 0,
      },
      ...g.news,
    ].slice(0, 40),
  };
}

/** Preserve v1 saves and add independent defaults for newly introduced features. */
export function migrateGame(raw: unknown, now = Date.now()): Game {
  const old = raw as Partial<Game>;
  if (
    !old ||
    old.version !== 1 ||
    !Number.isFinite(old.cash) ||
    !Number.isFinite(old.dayCash) ||
    !Array.isArray(old.assets) ||
    !Array.isArray(old.positions)
  )
    throw Error("Invalid MarketRush save.");
  const g = {
    ...old,
    schemaVersion: 2,
    investing: old.investing ?? createInvesting(now),
    arcade: old.arcade ?? createArcade(),
    transactions: old.transactions ?? [],
    transactionId: old.transactionId ?? 0,
    dayProfitClaimed: old.dayProfitClaimed ?? false,
  } as Game;
  g.initialWorth = old.initialWorth ?? netWorth(g);
  g.dailySnapshot = old.dailySnapshot ?? {
    date: new Date(now).toDateString(),
    value: netWorth(g),
  };
  return g;
}
