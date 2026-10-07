import { ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";
import { type Asset, change, money } from "../engine";

import { pct, price, remaining } from "../format";
export function MarketCard({
  a,
  selected,
  onClick,
}: {
  a: Asset;
  selected: boolean;
  onClick: () => void;
}) {
  const c = change(a, 1);
  return (
    <button
      className={`market-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="card-top">
        <span
          className="asset-symbol"
          style={{ color: a.color, background: `${a.color}18` }}
        >
          {a.symbol.slice(0, 2)}
        </span>
        <span className="category">{a.category}</span>
        <span className="live-label">
          {a.resolved ? (
            "RESOLVED"
          ) : (
            <>
              <i /> LIVE
            </>
          )}
        </span>
      </div>
      <h3>{a.name}</h3>
      <div className="card-prices">
        {a.kind === "prediction" ? (
          <>
            <span>
              <small>YES</small>
              <b>{price(a)}</b>
            </span>
            <span>
              <small>NO</small>
              <b>{price(a, 1 - a.price)}</b>
            </span>
            <span className={c >= 0 ? "positive" : "negative"}>
              {c >= 0 ? (
                <ArrowUpRight size={15} />
              ) : (
                <ArrowDownRight size={15} />
              )}{" "}
              {Math.abs(c).toFixed(1)}pp
            </span>
          </>
        ) : (
          <>
            <b>{price(a)}</b>
            <span className={c >= 0 ? "positive" : "negative"}>{pct(c)}</span>
          </>
        )}
      </div>
      <div className="probability">
        <i
          style={{
            width: `${a.kind === "prediction" ? a.price * 100 : 60}%`,
            background: a.color,
          }}
        />
      </div>
      <div className="card-footer">
        <span>
          {money(a.volume).replace(".00", "")} vol · {a.traders} traders
        </span>
        <span>
          <Clock size={12} />
          {a.resolved
            ? `Result: ${a.result ? "YES" : "NO"}`
            : a.kind === "prediction"
              ? remaining(a.expires - Date.now())
              : "10-min session"}
        </span>
      </div>
    </button>
  );
}
