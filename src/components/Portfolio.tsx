import { Wallet } from "lucide-react";
import { type Game, type Position, equity, money } from "../engine";

import { signed } from "../format";
import { PositionCard } from "./PositionCard";
export function Portfolio({
  g,
  onTrade,
}: {
  g: Game;
  onTrade: (
    id: string,
    side: Position["side"],
    action: "buy" | "sell",
    qty: number,
  ) => void;
}) {
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
          ["Prediction equity", money(equity(g, "prediction"))],
          ["Day-trading equity", money(equity(g, "stock"))],
          ["Realized P&L", signed(g.trades.reduce((s, t) => s + t.profit, 0))],
          ["Open positions", String(g.positions.length)],
        ].map(([k, v]) => (
          <div className="panel" key={k}>
            <small>{k}</small>
            <h2>{v}</h2>
          </div>
        ))}
      </div>
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
      {!g.positions.length && (
        <div className="empty panel">
          <Wallet size={40} />
          <h2>Your next move starts here.</h2>
          <p>
            Buy a prediction or start a trading day to build your portfolio.
          </p>
        </div>
      )}
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
    </>
  );
}
