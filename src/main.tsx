import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@fontsource/space-grotesk/latin-700.css";
import {
  Activity,
  ArrowUpRight,
  Check,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Casino } from "./components/Casino";
import { StockMarket } from "./components/StockMarket";
import {
  type Game,
  type Position,
  change,
  equity,
  loadGame,
  money,
  quote,
  restartPredictions,
  setLimits,
  startDay,
  tick,
  trade,
} from "./engine";
import { netWorth, toggleWatch, tradeStock } from "./investing";
import "./style.css";
import "./upgrade.css";
import { claimDaily, claimDayProfit } from "./wallet";

import { CashOutModal } from "./components/CashOutModal";
import { DayTradingPanel } from "./components/DayTradingPanel";
import { HowToPlay } from "./components/HowToPlay";
import { Leaderboard } from "./components/Leaderboard";
import { MarketCard } from "./components/MarketCard";
import { Navbar } from "./components/Navbar";
import { NewsFeed } from "./components/NewsFeed";
import { Portfolio } from "./components/Portfolio";
import { PriceChart } from "./components/PriceChart";
import { Profile } from "./components/Profile";
import { TradingPanel } from "./components/TradingPanel";
import { pct, price, remaining, signed } from "./format";
function App() {
  const [g, setG] = useState<Game>(loadGame),
    [page, setPage] = useState("Markets"),
    [selected, setSelected] = useState("COMETS"),
    [stock, setStock] = useState("NOVA"),
    [filter, setFilter] = useState("All markets"),
    [search, setSearch] = useState(""),
    [toast, setToast] = useState<{ text: string; error: boolean } | null>(null),
    [confirmation, setConfirmation] = useState<{
      label: string;
      run: () => void;
    } | null>(null),
    [saveError, setSaveError] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setG((s) => tick(s)), 1000);
    return () => clearInterval(timer);
  }, []);
  const lastSave = useRef<{ time: number; game: Game } | null>(null);
  useEffect(() => {
    const previous = lastSave.current;
    const economicChange =
      !previous ||
      previous.game.transactions !== g.transactions ||
      previous.game.arcade !== g.arcade ||
      previous.game.investing !== g.investing ||
      previous.game.trades !== g.trades ||
      previous.game.username !== g.username ||
      previous.game.dayStart !== g.dayStart ||
      previous.game.dayResult !== g.dayResult ||
      previous.game.assets.some((a, i) => a.resolved !== g.assets[i]?.resolved);
    if (!economicChange && previous && Date.now() - previous.time < 15000)
      return;
    try {
      localStorage.setItem("marketrush-v1", JSON.stringify(g));
      lastSave.current = { time: Date.now(), game: g };
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [g]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const currentGame = useRef(g);
  currentGame.current = g;
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(
          "marketrush-v1",
          JSON.stringify(currentGame.current),
        );
      } catch {
        setSaveError(true);
      }
    };
    const hide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hide);
    return () => {
      removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  const day = page === "Day Trading",
    a = g.assets.find((a) => a.id === (day ? stock : selected))!;
  const announce = (text: string, error = false) => setToast({ text, error });
  const apply = (fn: (g: Game) => Game, message?: string) => {
    try {
      const next = fn(tick(currentGame.current));
      currentGame.current = next;
      setG(next);
      if (message) announce(message);
    } catch (e) {
      announce((e as Error).message, true);
    }
  };
  const executeStock = (
    ticker: string,
    action: "buy" | "sell",
    shares: number,
  ) => {
    const run = () => {
      apply(
        (s) => tradeStock(s, ticker, action, shares),
        `${ticker} ${action === "buy" ? "shares purchased" : "shares sold"}.`,
      );
      setConfirmation(null);
    };
    const c = currentGame.current.investing.companies.find(
      (c) => c.ticker === ticker,
    )!;
    if (
      Number.isFinite(shares) &&
      shares > 0 &&
      (shares * c.price > 5000 ||
        shares * c.price > netWorth(currentGame.current) * 0.25)
    )
      setConfirmation({
        label: `${action} ${shares} ${ticker} shares. Prices are checked again at confirmation.`,
        run,
      });
    else run();
  };
  const execute = (
    id: string,
    side: Position["side"],
    action: "buy" | "sell",
    qty: number,
  ) => {
    const asset = g.assets.find((a) => a.id === id)!;
    const p = g.positions.find((p) => p.asset === id && p.side === side);
    const value = qty * quote(asset, side);
    const run = () => {
      try {
        const live = currentGame.current;
        const updated = trade(live, id, side, action, qty);
        currentGame.current = updated;
        setG(updated);
        const profit = updated.trades[0].profit;
        announce(
          action === "sell"
            ? `Position closed · ${signed(profit)} ${profit >= 0 ? "PROFIT" : "P&L"}`
            : `${qty} ${side} ${asset.symbol} · You're in!`,
        );
      } catch (e) {
        announce((e as Error).message, true);
      }
      setConfirmation(null);
    };
    if (
      Number.isSafeInteger(qty) &&
      qty > 0 &&
      (value > 5000 || value > equity(g, asset.kind) * 0.25)
    )
      setConfirmation({
        label: `${action === "buy" ? "Open" : "Close"} ${qty} ${side} ${asset.symbol} at the quoted price of ${money(quote(asset, side))}.`,
        run,
      });
    else run();
  };
  const markets = g.assets.filter(
    (x) =>
      x.kind === (day ? "stock" : "prediction") &&
      (day || filter === "All markets" || x.category === filter) &&
      x.name.toLowerCase().includes(search.toLowerCase()),
  );
  const position = g.positions.find((p) => p.asset === a.id);
  return (
    <>
      <Navbar g={g} page={page} setPage={setPage} />
      <main>
        {saveError && (
          <div className="save-warning" role="alert">
            Browser storage is unavailable. Progress will be lost when this page
            closes.
          </div>
        )}
        {page === "Markets" || day ? (
          <>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="dot" />{" "}
                  {day ? "DAY TRADING ARENA" : "THE MARKET NEVER SITS STILL"}
                </div>
                <h1>
                  {day
                    ? "Trade fast. Think faster"
                    : "Your next move starts here"}
                  <span>.</span>
                </h1>
                <p>
                  {day
                    ? "A whole trading day. Ten intense minutes. All Market Cash."
                    : "Predict the outcome. Ride the momentum. Cash out on your terms."}
                </p>
              </div>
              <div className="market-status">
                <span className="dot" /> Markets live{" "}
                <small>
                  {
                    g.assets.filter(
                      (a) => !a.resolved && a.kind === "prediction",
                    ).length
                  }{" "}
                  open predictions
                </small>
              </div>
            </div>
            {day ? (
              <DayTradingPanel
                g={g}
                onClaimProfit={() =>
                  apply(
                    (s) => claimDayProfit(s),
                    "Day-trading profit transferred to shared Market Cash.",
                  )
                }
                onStart={() => {
                  setG(startDay(g));
                  announce("Opening bell! Your 25,000 MC trading day begins.");
                }}
              />
            ) : (
              <div className="hero-strip">
                <div className="hero-icon">
                  <Zap size={25} />
                </div>
                <div>
                  <strong>Big conviction. Bigger possibilities.</strong>
                  <p>
                    Start with $10,000 MC. Every second is a new opportunity.
                  </p>
                </div>
                <button onClick={() => setPage("How to Play")}>
                  How it works <ArrowUpRight size={16} />
                </button>
                <div className="hero-decoration">↗</div>
              </div>
            )}
            {!day &&
              g.assets
                .filter((a) => a.kind === "prediction")
                .every((a) => a.resolved) && (
                <div className="day-banner">
                  <div>
                    <h2>Round complete. Keep the rush going.</h2>
                    <p>
                      Every prediction has settled. Your balance and progress
                      carry forward.
                    </p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => {
                      setG(restartPredictions(g));
                      announce("Fresh predictions are live!");
                    }}
                  >
                    Open next round
                  </button>
                </div>
              )}
            <div className="workspace">
              <section className="market-main">
                <div className="filters">
                  {!day &&
                    ["All markets", "Sports", "Pop culture", "Events"].map(
                      (f) => (
                        <button
                          className={filter === f ? "active" : ""}
                          key={f}
                          onClick={() => setFilter(f)}
                        >
                          {f}
                        </button>
                      ),
                    )}
                  <label className="search">
                    <Search size={15} />
                    <input
                      aria-label="Search markets"
                      placeholder={day ? "Search stocks" : "Search markets"}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                </div>
                <div className="market-grid">
                  {markets.map((m) => (
                    <MarketCard
                      key={m.id}
                      a={m}
                      selected={a.id === m.id}
                      onClick={() => (day ? setStock(m.id) : setSelected(m.id))}
                    />
                  ))}
                </div>
                {!markets.length && (
                  <div className="empty panel">
                    No markets match your search.
                  </div>
                )}
                <div className="panel featured">
                  <div className="featured-heading">
                    <div>
                      <div className="eyebrow">
                        {a.category.toUpperCase()}{" "}
                        <span>· {a.resolved ? "RESOLVED" : "LIVE MARKET"}</span>
                      </div>
                      <h2>{a.name}</h2>
                      <span className="muted">
                        {a.kind === "prediction"
                          ? a.resolved
                            ? `MARKET RESOLVED · RESULT: ${a.result ? "YES" : "NO"}`
                            : `Resolves in ${remaining(a.expires - Date.now())} · Simulated outcome`
                          : "Fictional company · No real-world asset"}
                      </span>
                    </div>
                    <div className="big-price">
                      <strong>{price(a)}</strong>
                      <span
                        className={change(a, 1) >= 0 ? "positive" : "negative"}
                      >
                        {a.kind === "prediction"
                          ? `${(a.price * 100).toFixed(1)}% probability · `
                          : ""}
                        {a.kind === "prediction"
                          ? `${change(a, 1) >= 0 ? "+" : ""}${change(a, 1).toFixed(2)}pp`
                          : pct(change(a, 1))}{" "}
                        · 1m
                      </span>
                    </div>
                  </div>
                  <PriceChart a={a} trades={g.trades} position={position} />
                  <div className="market-metrics">
                    {[
                      [
                        "1M CHANGE",
                        `${change(a, 1).toFixed(2)}${day ? "%" : "pp"}`,
                      ],
                      [
                        "5M CHANGE",
                        `${change(a, 5).toFixed(2)}${day ? "%" : "pp"}`,
                      ],
                      ["VOLUME", money(a.volume).replace(".00", "")],
                      ["TRADERS", a.traders.toLocaleString()],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <small>{k}</small>
                        <b>{v}</b>
                      </div>
                    ))}
                  </div>
                </div>
                <NewsFeed g={g} />
              </section>
              <aside>
                <TradingPanel
                  key={a.id}
                  g={g}
                  a={a}
                  onTrade={(s, act, q) => execute(a.id, s, act, q)}
                  onLimits={(side, stop, take) => {
                    try {
                      setG(setLimits(g, a.id, side, stop, take));
                      announce("Automatic exits saved.");
                    } catch (e) {
                      announce((e as Error).message, true);
                    }
                  }}
                />
                <div className="panel tip">
                  <Sparkles size={18} />
                  <div>
                    <h4>The rush is in the decision.</h4>
                    <p>
                      Prices can reverse. Lock in profits with cash out, or
                      trust your prediction until resolution.
                    </p>
                  </div>
                </div>
                <div className="safety">
                  <Check size={14} /> 100% fictional. 0% real money.
                </div>
              </aside>
            </div>
          </>
        ) : page === "Stock Market" ? (
          <StockMarket
            g={g}
            onTrade={executeStock}
            onWatch={(ticker) => apply((s) => toggleWatch(s, ticker))}
          />
        ) : page === "Casino" ? (
          <Casino g={g} onAction={apply} />
        ) : page === "Portfolio" ? (
          <Portfolio g={g} onTrade={execute} onStockTrade={executeStock} />
        ) : page === "Leaderboard" ? (
          <Leaderboard g={g} />
        ) : page === "Profile" ? (
          <Profile
            g={g}
            onName={(name) => {
              setG({ ...g, username: name });
              announce("Profile updated.");
            }}
            onBonus={() =>
              apply((s) => claimDaily(s), "+250 MC · Daily boost claimed!")
            }
          />
        ) : (
          <HowToPlay />
        )}
      </main>
      <footer>
        <span className="brand">
          <Activity size={16} /> MarketRush
        </span>
        <span>A game of timing, conviction, and a little chaos.</span>
        <span>SIMULATION · FAKE MONEY ONLY</span>
      </footer>
      {toast && (
        <div role="status" className={`toast ${toast.error ? "error" : ""}`}>
          {toast.error ? <X size={18} /> : <Check size={18} />} {toast.text}
        </div>
      )}
      {confirmation && (
        <CashOutModal
          label={confirmation.label}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmation.run}
        />
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
