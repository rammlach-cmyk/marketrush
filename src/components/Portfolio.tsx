import { Wallet } from "lucide-react";
import { type Game, type Position, equity, money } from "../engine";

import { pct, signed } from "../format";
import { netWorth, predictionValue, stockValue } from "../investing";
import { PositionCard } from "./PositionCard";
import { WalletHistory } from "./WalletHistory";
export function Portfolio({
  g,
  onTrade,
  onStockTrade,
}: {
  g: Game;
  onStockTrade: (
    ticker: string,
    action: "buy" | "sell",
    shares: number,
  ) => void;
  onTrade: (
    id: string,
    side: Position["side"],
    action: "buy" | "sell",
    qty: number,
  ) => void;
}) {
  const ranked = g.investing.holdings
    .map((h) => {
      const c = g.investing.companies.find((c) => c.ticker === h.ticker)!;
      return {
        ...h,
        price: c.price,
        pnl: (c.price - h.average) * h.shares,
        rate: (c.price / h.average - 1) * 100,
      };
    })
    .sort((a, b) => b.rate - a.rate);
  const worth = netWorth(g);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">EVERY MOVE COUNTS</div>
          <h1>
            Your portfolio<span>.</span>
          </h1>
          <p>Keep your winners close. Keep your exits closer.</p>
        </div>
      </div>
      <div className="stats-row">
        {[
          ["Cash", money(g.cash)],
          ["Stocks", money(stockValue(g))],
          ["Prediction markets", money(predictionValue(g))],
          ["Total net worth", money(worth)],
        ].map(([k, v]) => (
          <div className="panel" key={k}>
            <small>{k}</small>
            <h2>{v}</h2>
          </div>
        ))}
      </div>
      <div className="stats-row portfolio-performance">
        {[
          ["Today’s P&L", signed(worth - g.dailySnapshot.value)],
          ["Lifetime P&L", signed(worth - g.initialWorth)],
          ["Casino net result", signed(g.arcade.net)],
          ["Day practice equity", money(equity(g, "stock"))],
          [
            "Best stock",
            ranked[0]
              ? `${ranked[0].ticker} ${pct(ranked[0].rate)}`
              : "No stocks yet",
          ],
          [
            "Worst stock",
            ranked.at(-1)
              ? `${ranked.at(-1)!.ticker} ${pct(ranked.at(-1)!.rate)}`
              : "No stocks yet",
          ],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <small>{label}</small>
            <h3>{value}</h3>
          </div>
        ))}
      </div>
      <p className="portfolio-note">
        Shared net worth = cash + long-term stocks + prediction positions. P&L
        includes bonuses, rewards, transfers, and arcade results; day practice
        principal stays separate. Today is measured from your first activity
        each local day. Legacy saves begin with their migrated opening net
        worth.
      </p>
      {ranked.length > 0 && (
        <>
          <h2 className="holdings-title">Long-term stock holdings</h2>
          <div className="stock-holdings">
            {ranked.map((h) => (
              <div className="panel" key={h.ticker}>
                <div className="section-title">
                  <h3>{h.ticker}</h3>
                  <span>
                    {h.shares.toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}{" "}
                    shares
                  </span>
                </div>
                <div className="position-values">
                  <div>
                    <small>MARKET VALUE</small>
                    <strong>{money(h.shares * h.price)}</strong>
                  </div>
                  <div>
                    <small>RETURN</small>
                    <strong className={h.pnl >= 0 ? "positive" : "negative"}>
                      {signed(h.pnl)}
                    </strong>
                    <small>{pct(h.rate)}</small>
                  </div>
                </div>
                <div className="detail-line">
                  <span>Average {money(h.average)}</span>
                  <span>Current {money(h.price)}</span>
                </div>
                <button
                  className="cashout"
                  onClick={() =>
                    onStockTrade(
                      h.ticker,
                      "sell",
                      Math.round(h.shares * 10000) / 10000,
                    )
                  }
                >
                  SELL ALL {h.ticker}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="positions-grid">
        {g.positions.map((p) => {
          const a = g.assets.find((a) => a.id === p.asset)!;
          return (
            <div className="panel" key={`${p.asset}-${p.side}`}>
              <h3>{a.name}</h3>
              <PositionCard
                a={a}
                p={p}
                onCashOut={() => onTrade(a.id, p.side, "sell", p.qty)}
              />
            </div>
          );
        })}
      </div>
      {!g.positions.length && !ranked.length && (
        <div className="empty panel">
          <Wallet size={40} />
          <h2>Your next move starts here.</h2>
          <p>
            Buy a prediction or start a trading day to build your portfolio.
          </p>
        </div>
      )}
      <WalletHistory g={g} />
      <div className="panel table-panel">
        <h3>Trade history</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Market</th>
                <th>Action</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Realized P&L</th>
              </tr>
            </thead>
            <tbody>
              {g.trades.slice(0, 50).map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.time).toLocaleTimeString()}</td>
                  <td>{t.asset}</td>
                  <td>
                    {t.action} {t.side}
                  </td>
                  <td>{t.qty}</td>
                  <td>{money(t.price)}</td>
                  <td className={t.profit >= 0 ? "positive" : "negative"}>
                    {signed(t.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!g.trades.length && (
            <p className="muted">Your trades will appear here.</p>
          )}
        </div>
      </div>
      {g.investing.trades.length > 0 && (
        <div className="panel stock-trade-history">
          <h3>Stock trade history</h3>
          {g.investing.trades.slice(0, 50).map((t) => (
            <div className="ledger-row" key={t.id}>
              <div>
                <b>
                  {t.ticker} {t.action} ·{" "}
                  {t.shares.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{" "}
                  shares @ {money(t.price)}
                </b>
                <small>{new Date(t.time).toLocaleString()}</small>
              </div>
              <strong className={t.profit >= 0 ? "positive" : "negative"}>
                {signed(t.profit)} realized
              </strong>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
