import { useState } from "react";
import { netWorth } from "../investing";

import { type Game, money } from "../engine";

import { pct, signed } from "../format";
export function Leaderboard({ g }: { g: Game }) {
  const [period, setPeriod] = useState("Daily");
  const multiplier = period === "Daily" ? 1 : period === "Weekly" ? 2.2 : 5;
  const rows = [
    ["CircuitBreaker", 17420],
    ["MoonshotMia", 15980],
    ["TheOracle", 14560],
    ["HoldMyChart", 13240],
    ["GreenCandle", 12050],
    ["ZeroChill", 11600],
  ].map(([name, value], i) => ({
    name: String(name),
    value: 10000 + (Number(value) - 10000) * multiplier,
    best: (820 - i * 65) * multiplier,
    worst: -(220 + i * 33) * multiplier,
    rate: 78 - i * 4,
  }));
  const closed = g.trades.filter((t) => t.action !== "buy");
  rows.push({
    name: g.username,
    value: netWorth(g),
    best: Math.max(0, ...closed.map((t) => t.profit)),
    worst: Math.min(0, ...closed.map((t) => t.profit)),
    rate: closed.length
      ? (closed.filter((t) => t.profit > 0).length / closed.length) * 100
      : 0,
  });
  rows.sort((a, b) => b.value - a.value);
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">THE TOP OF THE TICKER</div>
        <h1>
          Chase the leaderboard<span>.</span>
        </h1>
        <p>
          Fictional demo rivals. Your row uses your live local prediction
          portfolio.
        </p>
      </div>
      <div className="filters">
        {["Daily", "Weekly", "All-time"].map((p) => (
          <button
            key={p}
            className={p === period ? "active" : ""}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Rank",
                  "Player",
                  "Portfolio value",
                  "Total return",
                  "Best trade",
                  "Worst trade",
                  "Win rate",
                ].map((t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.name} className={r.name === g.username ? "you" : ""}>
                  <td>
                    {i < 3 ? "🏆" : "#"} {i + 1}
                  </td>
                  <td>
                    <b>{r.name}</b>
                    {r.name === g.username && <span className="tiny">YOU</span>}
                  </td>
                  <td>{money(r.value)} MC</td>
                  <td className={r.value >= 10000 ? "positive" : "negative"}>
                    {pct((r.value / 10000 - 1) * 100)}
                  </td>
                  <td className="positive">{signed(r.best)}</td>
                  <td className="negative">{signed(r.worst)}</td>
                  <td>{r.rate.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">
          Demo rankings vary by period; your live row is cumulative. No real
          prizes or online competition in this version.
        </p>
      </div>
    </>
  );
}
