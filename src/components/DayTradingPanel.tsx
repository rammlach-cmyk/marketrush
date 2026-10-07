import { Zap } from "lucide-react";
import { type Game, money } from "../engine";

import { pct, remaining, signed } from "../format";
export function DayTradingPanel({
  g,
  onStart,
  onClaimProfit,
}: {
  g: Game;
  onStart: () => void;
  onClaimProfit: () => void;
}) {
  const elapsed = g.dayStart
    ? Math.max(0, Math.min(1, (Date.now() - g.dayStart) / 600000))
    : 0;
  const mins = 570 + Math.floor(elapsed * 390);
  return (
    <div className="day-banner">
      <div>
        <div className="eyebrow">
          <Zap size={14} /> THE TEN-MINUTE TRADING DAY
        </div>
        <h2>
          {g.dayResult !== null
            ? "Closing bell. How did you do?"
            : g.dayStart
              ? `${Math.floor(mins / 60) > 12 ? Math.floor(mins / 60) - 12 : Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")} ${mins >= 720 ? "PM" : "AM"} · ${elapsed < 0.2 ? "Opening volatility" : elapsed < 0.75 ? "Midday session" : "Afternoon rush"}`
              : "Big moves. Short sessions."}
        </h2>
        <p>
          Six fictional companies. $25,000 MC. Long, short, and outsmart the
          clock.
        </p>
        {g.dayResult !== null && (
          <p className={g.dayResult >= 25000 ? "positive" : "negative"}>
            Starting {money(25000)} → Ending {money(g.dayResult)} · Day P&L{" "}
            {signed(g.dayResult - 25000)} ·{" "}
            {pct((g.dayResult / 25000 - 1) * 100)}
          </p>
        )}
      </div>
      <div className="day-controls">
        {g.dayResult !== null && g.dayResult > 25000 && (
          <button
            className="secondary"
            disabled={g.dayProfitClaimed}
            onClick={onClaimProfit}
          >
            {g.dayProfitClaimed
              ? "Profit transferred ✓"
              : `Transfer ${money(g.dayResult - 25000)} MC profit`}
          </button>
        )}
        {!g.dayStart || g.dayResult !== null ? (
          <button className="primary" onClick={onStart}>
            <Zap size={16} />
            {g.dayResult !== null
              ? "Play another day"
              : "Ring the opening bell"}
          </button>
        ) : (
          <div className="session-clock">
            <small>UNTIL CLOSING BELL</small>
            <strong>{remaining((g.dayEnd || 0) - Date.now())}</strong>
            <div className="probability">
              <i style={{ width: `${elapsed * 100}%` }} />
            </div>
          </div>
        )}
      </div>
      <p className="practice-note">
        25,000 MC practice principal stays separate. Settled profits can
        transfer once to your shared wallet. Starting another day transfers
        unclaimed profits automatically.
      </p>
    </div>
  );
}
