import { useState } from "react";

import { ArrowUpRight, Wallet } from "lucide-react";
import { type Asset, type Game, type Position, money, quote } from "../engine";

import { price, signed } from "../format";
import { PositionCard } from "./PositionCard";
export function TradingPanel({
  g,
  a,
  onTrade,
  onLimits,
}: {
  g: Game;
  a: Asset;
  onTrade: (
    side: Position["side"],
    action: "buy" | "sell",
    qty: number,
  ) => void;
  onLimits: (side: Position["side"], stop?: number, take?: number) => void;
}) {
  const [side, setSide] = useState<Position["side"]>(
      a.kind === "stock" ? "LONG" : "YES",
    ),
    [action, setAction] = useState<"buy" | "sell">("buy"),
    [qty, setQty] = useState("100"),
    [stop, setStop] = useState(""),
    [take, setTake] = useState("");
  const p = g.positions.find((p) => p.asset === a.id && p.side === side),
    cash = a.kind === "stock" ? g.dayCash : g.cash;
  const q = Number(qty),
    cost = q * quote(a, side);
  const enabled =
    !a.resolved &&
    (a.kind === "prediction" || (g.dayStart !== null && g.dayResult === null));
  return (
    <div className="panel trading">
      <div className="section-title">
        <h3>{a.kind === "stock" ? "Trade shares" : "Make your move"}</h3>
        <span className="live-label">
          <i /> LIVE
        </span>
      </div>
      <p className="selected-market">{a.name}</p>
      <div className="segmented">
        {(a.kind === "stock" ? ["LONG", "SHORT"] : ["YES", "NO"]).map((s) => (
          <button
            key={s}
            className={side === s ? "selected" : ""}
            onClick={() => setSide(s as Position["side"])}
          >
            {s === "LONG" ? "Long" : s === "SHORT" ? "Short" : s}{" "}
            <b>{price(a, quote(a, s as Position["side"]))}</b>
          </button>
        ))}
      </div>
      <div className="trade-actions">
        <button
          className={action === "buy" ? "active" : ""}
          onClick={() => setAction("buy")}
        >
          {side === "SHORT" ? "Short" : "Buy"}
        </button>
        <button
          className={action === "sell" ? "active" : ""}
          onClick={() => setAction("sell")}
        >
          {side === "SHORT" ? "Cover" : "Sell"}
        </button>
      </div>
      <label className="quantity">
        Quantity <span>{a.kind === "stock" ? "shares" : "contracts"}</span>
        <input
          aria-label="Trade quantity"
          type="number"
          min="1"
          step="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
      </label>
      <div className="quick-amounts">
        {[10, 100, 500].map((n) => (
          <button key={n} onClick={() => setQty(String(n))}>
            {n}
          </button>
        ))}
        <button
          onClick={() =>
            setQty(
              String(
                action === "buy"
                  ? Math.floor(cash / quote(a, side))
                  : p?.qty || 0,
              ),
            )
          }
        >
          {action === "buy" ? "Buy Max" : "Sell Max"}
        </button>
      </div>
      <div className="detail-line">
        <span>
          {action === "buy"
            ? side === "SHORT"
              ? "Collateral reserved"
              : "Total cost"
            : "Estimated proceeds"}
        </span>
        <b>
          {money(
            action === "sell" && side === "SHORT" && p
              ? q * (2 * p.entry - a.price)
              : cost || 0,
          )}{" "}
          MC
        </b>
      </div>
      <button
        disabled={!enabled}
        className={`primary ${side === "NO" || side === "SHORT" ? "rose" : ""}`}
        onClick={() => onTrade(side, action, q)}
      >
        {a.resolved
          ? "MARKET RESOLVED"
          : `${action === "buy" ? (side === "SHORT" ? "Short" : "Buy") : side === "SHORT" ? "Cover" : "Sell"} ${side === "YES" || side === "NO" ? side : a.symbol}`}{" "}
        <ArrowUpRight size={17} />
      </button>
      <p className="trade-disclaimer">
        <Wallet size={13} /> Available: {money(cash)} MC · No fees
      </p>
      {p && (
        <PositionCard
          p={p}
          a={a}
          onCashOut={() => onTrade(side, "sell", p.qty)}
        />
      )}
      <div className="detail-line">
        <span>Realized P&L · this market</span>
        <b className="positive">
          {signed(
            g.trades
              .filter((t) => t.asset === a.id)
              .reduce((s, t) => s + t.profit, 0),
          )}
        </b>
      </div>
      {a.kind === "stock" && p && (
        <div className="limits">
          <h4>Protect your position</h4>
          <div>
            <label>
              Stop-loss
              <input
                type="number"
                placeholder="Price"
                value={stop}
                onChange={(e) => setStop(e.target.value)}
              />
            </label>
            <label>
              Take-profit
              <input
                type="number"
                placeholder="Price"
                value={take}
                onChange={(e) => setTake(e.target.value)}
              />
            </label>
          </div>
          <button
            className="secondary"
            onClick={() =>
              onLimits(
                side,
                stop ? Number(stop) : undefined,
                take ? Number(take) : undefined,
              )
            }
          >
            Save automatic exits
          </button>
          <small>
            Shorts reserve 100% collateral. Adverse moves can exceed it.
          </small>
        </div>
      )}
    </div>
  );
}
