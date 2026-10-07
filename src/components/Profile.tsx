import { useState } from "react";

import { Sparkles } from "lucide-react";
import { type Game, money } from "../engine";

import { signed } from "../format";
import { netWorth } from "../investing";
export function Profile({
  g,
  onBonus,
  onName,
}: {
  g: Game;
  onBonus: () => void;
  onName: (n: string) => void;
}) {
  const closed = g.trades.filter((t) => t.action !== "buy"),
    [name, setName] = useState(g.username);
  const won = closed.filter((t) => t.profit > 0).length;
  let streak = 0;
  for (const t of closed) {
    if (t.profit > 0) streak++;
    else break;
  }
  const counts: Record<string, number> = {};
  g.trades.forEach((t) => (counts[t.asset] = (counts[t.asset] || 0) + 1));
  const favorite =
    Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] ||
    "Find your favorite";
  const claimed = g.bonusDate === new Date().toDateString();
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">YOUR TRADING IDENTITY</div>
        <h1>
          Make a name for yourself<span>.</span>
        </h1>
        <p>
          Your progress is saved on this browser. No account or payment details
          needed.
        </p>
      </div>
      <div className="profile-layout">
        <div className="panel profile-card">
          <div className="big-avatar">MR</div>
          <h2>{g.username}</h2>
          <span className="tiny">
            LEVEL {1 + Math.floor(g.trades.length / 10)} · RISING TRADER
          </span>
          <label>
            Display name
            <input
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="secondary"
            onClick={() => onName(name.trim() || "You")}
          >
            Save name
          </button>
          <div className="bonus">
            <Sparkles />
            <h3>Your daily boost</h3>
            <p>+250 MC, once each local calendar day.</p>
            <button className="primary" disabled={claimed} onClick={onBonus}>
              {claimed ? "Bonus claimed ✓" : "Claim 250 MC"}
            </button>
          </div>
        </div>
        <div>
          <div className="stats-row profile-stats">
            {[
              ["Fake cash", money(g.cash)],
              ["Portfolio value", money(netWorth(g))],
              [
                "Lifetime realized P&L",
                signed(closed.reduce((s, t) => s + t.profit, 0)),
              ],
              [
                "Win rate",
                `${closed.length ? ((won / closed.length) * 100).toFixed(0) : 0}%`,
              ],
              ["Trades", String(g.trades.length)],
              [
                "Best trade",
                signed(Math.max(0, ...closed.map((t) => t.profit))),
              ],
              [
                "Worst trade",
                signed(Math.min(0, ...closed.map((t) => t.profit))),
              ],
              ["Favorite market", favorite],
              ["Winning streak", String(streak)],
            ].map(([k, v]) => (
              <div className="panel" key={k}>
                <small>{k}</small>
                <h3>{v}</h3>
              </div>
            ))}
          </div>
          <h2 className="achievement-title">Small wins. Big energy.</h2>
          <div className="achievements">
            {[
              ["🏆", "First Trade", 100],
              ["🔥", "5 Trades Won", 250],
              ["📈", "+$1,000 Profit", 500],
              ["💰", "$50,000 Portfolio", 1000],
              ["⚡", "10 Trades in One Day", 200],
              ["🧠", "Perfect Prediction", 300],
            ].map(([icon, name, value]) => (
              <div
                className={`panel achievement ${g.rewards.includes(String(name)) ? "unlocked" : ""}`}
                key={name}
              >
                <span>{icon}</span>
                <h4>{name}</h4>
                <small>
                  {g.rewards.includes(String(name))
                    ? "Unlocked · reward credited"
                    : `Reward: ${value} MC`}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
