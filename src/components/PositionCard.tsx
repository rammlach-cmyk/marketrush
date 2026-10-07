import { ArrowUpRight, Zap } from "lucide-react";
import { type Asset, type Position, money, positionValue } from "../engine";

import { pct, signed } from "../format";
export function PositionCard({
  p,
  a,
  onCashOut,
}: {
  p: Position;
  a: Asset;
  onCashOut: () => void;
}) {
  const value = positionValue(p, a),
    profit = value - p.entry * p.qty;
  return (
    <div className="position-card">
      <div className="section-title">
        <span>
          YOUR POSITION <b className="side-tag">{p.side}</b>
        </span>
        <span>
          {p.qty} {a.kind === "stock" ? "shares" : "contracts"}
        </span>
      </div>
      <div className="position-values">
        <div>
          <small>POSITION VALUE</small>
          <strong>{money(value)}</strong>
        </div>
        <div>
          <small>UNREALIZED P&L</small>
          <strong className={profit >= 0 ? "positive" : "negative"}>
            {signed(profit)}
          </strong>
          <small className={profit >= 0 ? "positive" : "negative"}>
            {pct((profit / (p.entry * p.qty)) * 100)}
          </small>
        </div>
      </div>
      <div className="detail-line">
        <span>Average entry {money(p.entry)}</span>
        <span>Entry value {money(p.entry * p.qty)}</span>
      </div>
      <button className="cashout" onClick={onCashOut}>
        <Zap size={17} /> CASH OUT <ArrowUpRight size={17} />
      </button>
      {p.stop !== undefined && (
        <small>
          Stop-loss: {money(p.stop)} · Take-profit:{" "}
          {p.take === undefined ? "—" : money(p.take)}
        </small>
      )}
    </div>
  );
}
