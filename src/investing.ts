import type { Game, Point } from "./engine";
import { walletChange } from "./wallet";
export const STOCK_INTERVAL = 300000;
const DAY = 86400000;
const bound = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export type Company = {
  ticker: string;
  name: string;
  industry: string;
  description: string;
  price: number;
  initialPrice: number;
  sharesOutstanding: number;
  growth: number;
  volatility: number;
  health: number;
  momentum: number;
  history: Point[];
  color: string;
};
export type Holding = { ticker: string; shares: number; average: number };
export type StockTrade = {
  id: number;
  ticker: string;
  action: "buy" | "sell";
  shares: number;
  price: number;
  time: number;
  profit: number;
};
export type StockNews = {
  id: string;
  time: number;
  ticker: string;
  headline: string;
  impact: number;
};
export type MarketEvent = {
  name: string;
  industry: string | null;
  impact: number;
  remaining: number;
};
export type Investing = {
  companies: Company[];
  holdings: Holding[];
  trades: StockTrade[];
  watchlist: string[];
  lastUpdate: number;
  sentiment: number;
  industries: Record<string, number>;
  events: MarketEvent[];
  news: StockNews[];
  indexHistory: Point[];
};
const seeds: [string, string, string, number, string][] = [
  [
    "NOVA",
    "Nova Technologies",
    "Technology",
    84.25,
    "Connected devices and cloud tools for fictional cities.",
  ],
  [
    "SKY",
    "Skyline AI",
    "AI",
    218.4,
    "Friendly artificial intelligence for creators and explorers.",
  ],
  [
    "APX",
    "Apex Motors",
    "Automotive",
    142.6,
    "Performance vehicles built for imaginary roads.",
  ],
  [
    "TSPO",
    "Titan Sports",
    "Sports",
    56.8,
    "Next-generation equipment for fictional athletes.",
  ],
  [
    "ORBT",
    "Orbit Energy",
    "Energy",
    103.2,
    "Clean power for a brighter fictional future.",
  ],
  [
    "PLS",
    "Pulse Media",
    "Media",
    32.45,
    "Independent stories, streaming, and digital culture.",
  ],
  [
    "VEL",
    "Velocity Gaming",
    "Gaming",
    64.8,
    "Multiplayer adventures and ambitious virtual worlds.",
  ],
  [
    "SMT",
    "Summit Aerospace",
    "Aerospace",
    176.2,
    "Orbital transport and high-altitude exploration.",
  ],
  [
    "QTM",
    "Quantum Computing",
    "Technology",
    132.4,
    "Experimental computing for complex fictional problems.",
  ],
  [
    "NXR",
    "Nexus Robotics",
    "AI",
    98.75,
    "Helpful robots for homes and industry.",
  ],
  [
    "EMBER",
    "Ember Studios",
    "Entertainment",
    47.3,
    "Original movies and spectacular live experiences.",
  ],
  [
    "PRSM",
    "Prism Retail",
    "Retail",
    28.6,
    "Colorful neighborhood stores and clever online shopping.",
  ],
  [
    "VITA",
    "Vitalis Health",
    "Healthcare",
    112.8,
    "Fictional diagnostics and accessible care technology.",
  ],
  [
    "FORK",
    "Fork & Field",
    "Food",
    39.2,
    "Fresh ingredients and imaginative fast-casual dining.",
  ],
  [
    "VAULT",
    "Vault Finance",
    "Finance",
    76.4,
    "Fictional business analytics and financial software.",
  ],
  [
    "FLUX",
    "Flux Systems",
    "Technology",
    59.1,
    "Efficient networks connecting the imaginary world.",
  ],
  [
    "MIND",
    "Mindwave Labs",
    "AI",
    156.2,
    "Assistive intelligence and language research.",
  ],
  [
    "RIFT",
    "Rift Interactive",
    "Gaming",
    43.9,
    "Competitive games with unforgettable characters.",
  ],
  [
    "STRK",
    "Striker Athletics",
    "Sports",
    35.6,
    "Sporting goods and training experiences.",
  ],
  [
    "VOLT",
    "Volt Mobility",
    "Automotive",
    67.4,
    "Electric city transport and playful urban travel.",
  ],
  [
    "TIDE",
    "Tidal Power",
    "Energy",
    81.7,
    "Fictional ocean-powered clean energy.",
  ],
  [
    "ECHO",
    "Echo Entertainment",
    "Entertainment",
    51.2,
    "Music festivals and immersive fictional concerts.",
  ],
  [
    "SIGN",
    "Signal Broadcasting",
    "Media",
    24.8,
    "News, podcasts, and local storytelling.",
  ],
  [
    "LOOM",
    "Loom Collective",
    "Retail",
    42.5,
    "Sustainable fashion for imaginary wardrobes.",
  ],
  [
    "HEAL",
    "Helix Care",
    "Healthcare",
    126.5,
    "Fictional therapies and patient support systems.",
  ],
  [
    "ASTR",
    "Astra Flight",
    "Aerospace",
    204.3,
    "Reusable spacecraft for fictional frontier missions.",
  ],
  [
    "SPRT",
    "Sprout Foods",
    "Food",
    31.4,
    "Plant-based foods and neighborhood kitchens.",
  ],
  [
    "BRDG",
    "Bridge Analytics",
    "Finance",
    91.6,
    "Fictional planning software for small enterprises.",
  ],
  [
    "PIX",
    "Pixel Forge",
    "Gaming",
    72.8,
    "Creative game engines and virtual design tools.",
  ],
  [
    "ION",
    "Ion Storage",
    "Energy",
    62.3,
    "Advanced batteries for imaginary infrastructure.",
  ],
  [
    "KITE",
    "Kite Networks",
    "Technology",
    48.9,
    "Wireless networks for distant fictional communities.",
  ],
  [
    "ZEN",
    "Zenith AI",
    "AI",
    188.1,
    "AI copilots for fictional scientific research.",
  ],
  [
    "ARENA",
    "Arena League",
    "Sports",
    44.7,
    "Fictional leagues, teams, and fan experiences.",
  ],
];
function historical(price: number, now: number, seed: number): Point[] {
  // A bounded synthetic backstory; seed data is clearly labelled in the UI.
  const times = new Set<number>();
  for (let i = 30; i >= 1; i--) times.add(now - i * DAY);
  for (let i = 144; i >= 0; i--) times.add(now - i * 600000);
  return [...times]
    .sort((a, b) => a - b)
    .map((time) => {
      const age = (now - time) / DAY;
      return {
        time,
        price:
          price *
          Math.exp(
            -age * 0.0015 +
              Math.sin(age * 0.8 + seed) * 0.045 * Math.min(1, age),
          ),
      };
    });
}
export function createInvesting(now = Date.now()): Investing {
  const companies = seeds.map(
    ([ticker, name, industry, price, description], i): Company => ({
      ticker,
      name,
      industry,
      price,
      initialPrice: price,
      description,
      sharesOutstanding: (120 + i * 23) * 1000000,
      growth: 0.00015 + (i % 5) * 0.00006,
      volatility: 0.002 + (i % 6) * 0.0012,
      health: 0.55 + (i % 5) * 0.08,
      momentum: 0,
      color: ["#ac93ff", "#47e6b1", "#38bdf8", "#fbbf24", "#fb7185"][i % 5],
      history: historical(price, now, i),
    }),
  );
  const times = companies[0].history.map((p) => p.time);
  const indexHistory = times.map((time, i) => ({
    time,
    price:
      (10000 *
        companies.reduce(
          (sum, c) => sum + c.history[i].price / c.initialPrice,
          0,
        )) /
      companies.length,
  }));
  return {
    companies,
    holdings: [],
    trades: [],
    watchlist: [],
    lastUpdate: now,
    sentiment: 0,
    industries: {},
    events: [],
    news: [
      {
        id: "stock-welcome",
        time: now,
        ticker: "MRX",
        headline: "The fictional exchange is open. Your long game starts here.",
        impact: 0,
      },
    ],
    indexHistory,
  };
}
export function indexValue(s: Investing) {
  return (
    (10000 *
      s.companies.reduce((sum, c) => sum + c.price / c.initialPrice, 0)) /
    s.companies.length
  );
}
export function stockValue(g: Game) {
  return g.investing.holdings.reduce(
    (sum, h) =>
      sum +
      h.shares *
        (g.investing.companies.find((c) => c.ticker === h.ticker)?.price || 0),
    0,
  );
}
export function predictionValue(g: Game) {
  return g.positions
    .filter(
      (p) => g.assets.find((a) => a.id === p.asset)?.kind === "prediction",
    )
    .reduce((sum, p) => {
      const a = g.assets.find((a) => a.id === p.asset)!;
      return sum + p.qty * (p.side === "NO" ? 1 - a.price : a.price);
    }, 0);
}
export function netWorth(g: Game) {
  return g.cash + stockValue(g) + predictionValue(g);
}
export function dailyChange(c: Company, now = Date.now()) {
  const point = c.history.find((p) => p.time >= now - DAY) || c.history[0];
  return (c.price / point.price - 1) * 100;
}
const events: Omit<MarketEvent, "remaining">[] = [
  { name: "TECH RALLY", industry: "Technology", impact: 0.018 },
  { name: "MARKET SELLOFF", industry: null, impact: -0.015 },
  { name: "ENERGY BOOM", industry: "Energy", impact: 0.025 },
  { name: "GAMING CRASH", industry: "Gaming", impact: -0.028 },
  { name: "AI MANIA", industry: "AI", impact: 0.03 },
  { name: "RECESSION FEARS", industry: null, impact: -0.012 },
  { name: "SPORTS INDUSTRY SURGE", industry: "Sports", impact: 0.022 },
];
export function updateInvesting(
  original: Investing,
  now = Date.now(),
  random = Math.random,
): Investing {
  const count = Math.floor((now - original.lastUpdate) / STOCK_INTERVAL);
  if (count <= 0) return original;
  let s = original;
  // At most seven days of five-minute catch-up. Longer gaps retain the latest seven days,
  // avoiding unbounded work on low-powered devices. History stays bounded and prices remain positive.
  const steps = Math.min(count, 2016),
    start = original.lastUpdate + (count - steps) * STOCK_INTERVAL;
  for (let k = 1; k <= steps; k++) {
    const time = start + k * STOCK_INTERVAL;
    let active = s.events
      .filter((e) => e.remaining > 1)
      .map((e) => ({ ...e, remaining: e.remaining - 1 }));
    let news = [...s.news];
    if (random() < 0.045) {
      const event = {
        ...events[Math.floor(random() * events.length)],
        remaining: 3,
      };
      active = [...active, event].slice(-4);
      news.unshift({
        id: `event-${time}`,
        time,
        ticker: event.industry || "MRX",
        headline: `${event.name}: fictional sentiment shifts across ${event.industry || "the market"}.`,
        impact: event.impact,
      });
    }
    const sentiment = bound(
      s.sentiment * 0.85 + (random() - 0.5) * 0.0015,
      -0.004,
      0.004,
    );
    const industries = { ...s.industries };
    for (const industry of new Set(s.companies.map((c) => c.industry)))
      industries[industry] = bound(
        (industries[industry] || 0) * 0.7 + (random() - 0.5) * 0.002,
        -0.004,
        0.004,
      );
    const companies = s.companies.map((c) => {
      let shock = 0;
      if (random() < 0.012) {
        shock = (random() < 0.5 ? -1 : 1) * (0.04 + random() * 0.07);
        const positives = [
          "announces a breakthrough product",
          "reports record fictional sales",
          "signs a major partnership",
          "secures a new production site",
        ];
        const negatives = [
          "delays a major release",
          "reports a fictional supply shortage",
          "cuts its simulated growth forecast",
          "faces an unexpected product recall",
        ];
        news.unshift({
          id: `${c.ticker}-${time}`,
          time,
          ticker: c.ticker,
          headline: `${c.name} ${(shock > 0 ? positives : negatives)[Math.floor(random() * 4)]}.`,
          impact: shock,
        });
      }
      const momentum = bound(
        c.momentum * 0.55 + (random() - 0.5) * c.volatility,
        -0.012,
        0.012,
      );
      const eventImpact = active
        .filter((e) => e.industry === null || e.industry === c.industry)
        .reduce((sum, e) => sum + e.impact * (e.remaining / 3), 0);
      const movement = bound(
        c.growth +
          (c.health - 0.65) * 0.001 +
          momentum +
          industries[c.industry] +
          sentiment +
          (random() - 0.5) * c.volatility +
          shock +
          eventImpact,
        -0.2,
        0.2,
      );
      const price = bound(c.price * (1 + movement), 0.5, 1000000),
        health = bound(c.health + shock * 0.3, 0.1, 0.95);
      const history = [...c.history, { time, price }];
      // Retain daily points beyond two days, and every five-minute point in the recent window.
      const compact = history
        .filter(
          (p, i) =>
            p.time >= time - 2 * DAY ||
            i === 0 ||
            Math.floor(p.time / DAY) !==
              Math.floor(history[Math.max(0, i - 1)].time / DAY),
        )
        .filter((p) => p.time >= time - 35 * DAY);
      return { ...c, price, health, momentum, history: compact };
    });
    const value = indexValue({ ...s, companies });
    const history = [...s.indexHistory, { time, price: value }];
    const indexHistory = history
      .filter(
        (p, i) =>
          p.time >= time - 2 * DAY ||
          i === 0 ||
          Math.floor(p.time / DAY) !==
            Math.floor(history[Math.max(0, i - 1)].time / DAY),
      )
      .filter((p) => p.time >= time - 35 * DAY);
    s = {
      ...s,
      companies,
      sentiment,
      industries,
      events: active,
      news: news.slice(0, 80),
      indexHistory,
      lastUpdate: time,
    };
  }
  return s;
}
export function tradeStock(
  g: Game,
  ticker: string,
  action: "buy" | "sell",
  shares: number,
  now = Date.now(),
): Game {
  const c = g.investing.companies.find((c) => c.ticker === ticker);
  if (!c) throw Error("Unknown company.");
  if (
    !Number.isFinite(shares) ||
    shares <= 0 ||
    Math.abs(shares * 10000 - Math.round(shares * 10000)) > 1e-6
  )
    throw Error("Enter positive shares with up to four decimal places.");
  shares = Math.round(shares * 10000) / 10000;
  const existing = g.investing.holdings.find((h) => h.ticker === ticker),
    cost = shares * c.price;
  let holdings = g.investing.holdings.map((h) => ({ ...h })),
    profit = 0;
  if (action === "buy") {
    if (cost > g.cash + 1e-8) throw Error("Not enough Market Cash.");
    if (existing)
      holdings = holdings.map((h) =>
        h.ticker === ticker
          ? {
              ...h,
              shares: Math.round((h.shares + shares) * 10000) / 10000,
              average: (h.shares * h.average + cost) / (h.shares + shares),
            }
          : h,
      );
    else holdings.push({ ticker, shares, average: c.price });
  } else {
    if (!existing || shares > existing.shares + 1e-8)
      throw Error("You do not own that many shares.");
    profit = (c.price - existing.average) * shares;
    holdings = holdings
      .map((h) =>
        h.ticker === ticker
          ? { ...h, shares: Math.max(0, h.shares - shares) }
          : h,
      )
      .filter((h) => h.shares > 1e-8);
  }
  const next = walletChange(
    g,
    action === "buy" ? -cost : cost,
    `${ticker} STOCK ${action === "buy" ? "PURCHASE" : "SALE"}`,
    now,
  );
  return {
    ...next,
    investing: {
      ...g.investing,
      holdings,
      trades: [
        {
          id: next.transactionId,
          ticker,
          action,
          shares,
          price: c.price,
          time: now,
          profit,
        },
        ...g.investing.trades,
      ].slice(0, 1000),
    },
  };
}
export function toggleWatch(g: Game, ticker: string): Game {
  if (!g.investing.companies.some((c) => c.ticker === ticker))
    throw Error("Unknown company.");
  return {
    ...g,
    investing: {
      ...g.investing,
      watchlist: g.investing.watchlist.includes(ticker)
        ? g.investing.watchlist.filter((t) => t !== ticker)
        : [...g.investing.watchlist, ticker],
    },
  };
}
