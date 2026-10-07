import { useState } from "react";
import { type Game, money } from "../engine";
import { signed } from "../format";
export function WalletHistory({ g }: { g: Game }) {
  const [wallet, setWallet] = useState("All activity");
  const rows = g.transactions.filter(
    (t) =>
      wallet === "All activity" ||
      t.wallet === (wallet === "Shared wallet" ? "shared" : "practice"),
  );
  return (
    <div className="panel wallet-history">
      <div className="section-title">
        <h3>Market Cash transactions</h3>
        <select
          aria-label="Transaction wallet"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
        >
          {["All activity", "Shared wallet", "Day practice"].map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
      </div>
      <div className="ledger-list">
        {rows.slice(0, 100).map((t) => (
          <div className="ledger-row" key={t.id}>
            <div>
              <b>{t.label}</b>
              <small>
                {new Date(t.time).toLocaleString()} ·{" "}
                {t.wallet === "shared" ? "Shared wallet" : "Day practice"}
              </small>
            </div>
            <div>
              <strong className={t.amount >= 0 ? "positive" : "negative"}>
                {signed(t.amount)} MC
              </strong>
              <small>Balance {money(t.balance)} MC</small>
            </div>
          </div>
        ))}
      </div>
      {!rows.length && (
        <p>
          No transactions yet. Existing trades remain in trade history below.
        </p>
      )}
      <p className="muted">
        Latest 1,000 wallet entries are retained. Day practice principal is
        separate from shared net worth.
      </p>
    </div>
  );
}
