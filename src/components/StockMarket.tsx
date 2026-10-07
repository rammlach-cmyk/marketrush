import {
  ArrowUpRight,
  Building2,
  Clock,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { type Asset, type Game, type Trade, money } from "../engine";
import { pct, remaining, signed } from "../format";
import {
  type Company,
  dailyChange,
  indexValue,
  STOCK_INTERVAL,
} from "../investing";
import { PriceChart } from "./PriceChart";
export const LONG_RANGES = {
  "1H": 3600000,
  "6H": 21600000,
  "1D": 86400000,
  "1W": 604800000,
  "1M": 2592000000,
  ALL: Infinity,
};
const compact = (n: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
function chartAsset(c: Company): Asset {
  return {
    id: `invest-${c.ticker}`,
    symbol: c.ticker,
    name: c.name,
    category: c.industry,
    kind: "stock",
    price: c.price,
    anchor: c.initialPrice,
    momentum: c.momentum,
    history: c.history,
    expires: 0,
    volume: 0,
    traders: 0,
    color: c.color,
  };
}
export function StockMarket({
  g,
  onTrade,
  onWatch,
}: {
  g: Game;
  onTrade: (ticker: string, action: "buy" | "sell", shares: number) => void;
  onWatch: (ticker: string) => void;
}) {
  const [ticker, setTicker] = useState("NOVA"),
    [filter, setFilter] = useState("All companies"),
    [sort, setSort] = useState("Top Gainers"),
    [search, setSearch] = useState(""),
    [shares, setShares] = useState("1"),
    [action, setAction] = useState<"buy" | "sell">("buy");
  const s = g.investing,
    c = s.companies.find((c) => c.ticker === ticker)!,
    holding = s.holdings.find((h) => h.ticker === ticker),
    value = (holding?.shares || 0) * c.price,
    pnl = value - (holding ? holding.shares * holding.average : 0);
  const index = indexValue(s);
  const filtered = s.companies
    .filter(
      (c) =>
        (filter === "All companies" ||
          (filter === "Watchlist" && s.watchlist.includes(c.ticker)) ||
          c.industry === filter) &&
        `${c.name} ${c.ticker}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Top Gainers"
        ? dailyChange(b) - dailyChange(a)
        : sort === "Top Losers"
          ? dailyChange(a) - dailyChange(b)
          : sort === "Most Valuable"
            ? b.price * b.sharesOutstanding - a.price * a.sharesOutstanding
            : b.volatility - a.volatility,
    );
  const trades: Trade[] = s.trades
    .filter((t) => t.ticker === ticker)
    .map((t) => ({
      id: String(t.id),
      asset: `invest-${ticker}`,
      side: "LONG",
      action: t.action,
      qty: t.shares,
      price: t.price,
      time: t.time,
      profit: t.profit,
    }));
  const indexAsset: Asset = {
    ...chartAsset(c),
    id: "MRX-index",
    name: "MRX — MarketRush Index",
    price: index,
    anchor: 10000,
    history: s.indexHistory,
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <TrendingUp size={13} /> THE LONG GAME
          </div>
          <h1>
            Build something that lasts<span>.</span>
          </h1>
          <p>
            33 fictional companies. One shared wallet. A new chapter every five
            minutes.
          </p>
        </div>
        <div className="update-clock">
          <Clock size={16} />
          <div>
            <small>NEXT MARKET UPDATE</small>
            <strong>
              {remaining(s.lastUpdate + STOCK_INTERVAL - Date.now())}
            </strong>
          </div>
        </div>
      </div>
      <div className="stock-overview">
        <div className="panel index-panel">
          <div className="section-title">
            <div>
              <span className="eyebrow">MRX — MARKETRUSH INDEX</span>
              <h2>
                {index.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                <span className={index >= 10000 ? "positive" : "negative"}>
                  {pct((index / 10000 - 1) * 100)}
                </span>
              </h2>
            </div>
            <span className="tiny">EQUAL WEIGHT · BASE 10,000</span>
          </div>
          <PriceChart
            a={indexAsset}
            valueLabel="INDEX POINTS"
            formatValue={(n) =>
              n.toLocaleString(undefined, { maximumFractionDigits: 0 })
            }
            trades={[]}
            rangeOptions={LONG_RANGES}
            updateLabel="Fictional history · 5-minute updates"
          />
        </div>
        <div className="panel long-summary">
          <Building2 size={23} />
          <small>YOUR LONG-TERM HOLDINGS</small>
          <strong>
            {money(
              s.holdings.reduce(
                (sum, h) =>
                  sum +
                  h.shares *
                    s.companies.find((c) => c.ticker === h.ticker)!.price,
                0,
              ),
            )}{" "}
            <em>MC</em>
          </strong>
          <p>{s.holdings.length} companies in your portfolio</p>
          <div className="detail-line">
            <span>Shared Market Cash</span>
            <b>{money(g.cash)} MC</b>
          </div>
          <div className="detail-line">
            <span>Watchlist</span>
            <b>{s.watchlist.length} favorites</b>
          </div>
          <p>
            Invest trading earnings here. Your holdings keep moving while you’re
            away.
          </p>
        </div>
      </div>
      <div className="panel watchlist-strip">
        <div>
          <h3>Watchlist</h3>
          <small>Your starred companies, one tap away.</small>
        </div>
        <div>
          {s.watchlist.length ? (
            s.watchlist.map((t) => {
              const row = s.companies.find((c) => c.ticker === t)!;
              return (
                <button
                  key={t}
                  className={ticker === t ? "selected" : ""}
                  onClick={() => {
                    setTicker(t);
                    setShares("1");
                  }}
                >
                  <Star size={12} />
                  <b>{t}</b>
                  <span>{money(row.price)}</span>
                </button>
              );
            })
          ) : (
            <p>Star a company to keep it here.</p>
          )}
        </div>
      </div>
      {s.events.length > 0 && (
        <div className="market-events">
          {s.events.map((e, i) => (
            <span
              key={`${e.name}-${i}`}
              className={e.impact >= 0 ? "positive" : "negative"}
            >
              {e.impact >= 0 ? "↗" : "↘"} {e.name} · {e.remaining} updates left
            </span>
          ))}
        </div>
      )}
      <div className="invest-workspace">
        <section>
          <div className="panel company-detail">
            <div className="featured-heading">
              <div>
                <div className="eyebrow">
                  {c.industry.toUpperCase()} · {c.ticker}
                </div>
                <h2>{c.name}</h2>
                <p>{c.description}</p>
              </div>
              <button
                className={`favorite ${s.watchlist.includes(c.ticker) ? "on" : ""}`}
                aria-label={`${s.watchlist.includes(c.ticker) ? "Remove" : "Add"} ${c.ticker} ${s.watchlist.includes(c.ticker) ? "from" : "to"} watchlist`}
                onClick={() => onWatch(c.ticker)}
              >
                <Star size={21} />
              </button>
            </div>
            <div className="company-price">
              <strong key={c.price}>{money(c.price)}</strong>
              <span className={dailyChange(c) >= 0 ? "positive" : "negative"}>
                {pct(dailyChange(c))} · 24H
              </span>
            </div>
            <PriceChart
              key={c.ticker}
              a={chartAsset(c)}
              trades={trades}
              position={
                holding
                  ? {
                      asset: `invest-${ticker}`,
                      side: "LONG",
                      qty: holding.shares,
                      entry: holding.average,
                    }
                  : undefined
              }
              rangeOptions={LONG_RANGES}
              updateLabel="Seeded fictional history · 5-minute updates"
            />
            <div className="market-metrics">
              {[
                ["MARKET CAP", `${compact(c.price * c.sharesOutstanding)} MC`],
                [
                  "VOLATILITY",
                  c.volatility < 0.004
                    ? "Low"
                    : c.volatility < 0.007
                      ? "Medium"
                      : "High",
                ],
                ["COMPANY HEALTH", `${Math.round(c.health * 100)} / 100`],
                ["BASE GROWTH", `${(c.growth * 100).toFixed(3)}%`],
              ].map(([k, v]) => (
                <div key={k}>
                  <small>{k}</small>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="panel screener">
            <div className="section-title">
              <h3>Stock screener</h3>
              <span className="tiny">33 FICTIONAL COMPANIES</span>
            </div>
            <div className="screener-controls">
              <label>
                Industry
                <select
                  aria-label="Stock industry"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    "All companies",
                    "Watchlist",
                    ...new Set(s.companies.map((c) => c.industry)),
                  ].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label>
                Sort by
                <select
                  aria-label="Sort stocks"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {[
                    "Top Gainers",
                    "Top Losers",
                    "Most Valuable",
                    "Most Volatile",
                  ].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label className="search">
                <Search size={15} />
                <input
                  aria-label="Search companies"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or ticker"
                />
              </label>
            </div>
            <div className="table-scroll company-table">
              <table>
                <thead>
                  <tr>
                    <th>Watch</th>
                    <th>Company</th>
                    <th>Industry</th>
                    <th>Price</th>
                    <th>24H</th>
                    <th>Market cap</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.ticker}
                      className={ticker === row.ticker ? "you" : ""}
                    >
                      <td>
                        <button
                          className={`favorite ${s.watchlist.includes(row.ticker) ? "on" : ""}`}
                          aria-label={`Favorite ${row.ticker}`}
                          onClick={() => onWatch(row.ticker)}
                        >
                          <Star size={15} />
                        </button>
                      </td>
                      <td>
                        <b>{row.ticker}</b>
                        <small>{row.name}</small>
                      </td>
                      <td>{row.industry}</td>
                      <td>{money(row.price)}</td>
                      <td
                        className={
                          dailyChange(row) >= 0 ? "positive" : "negative"
                        }
                      >
                        {pct(dailyChange(row))}
                      </td>
                      <td>{compact(row.price * row.sharesOutstanding)}</td>
                      <td>
                        <button
                          className="ticker-link"
                          onClick={() => {
                            setTicker(row.ticker);
                            setShares("1");
                          }}
                          aria-label={`Trade ${row.ticker}`}
                        >
                          Trade <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!filtered.length && (
              <p className="empty">
                {filter === "Watchlist"
                  ? "Star a company to start your watchlist."
                  : "No companies match your search."}
              </p>
            )}
          </div>
          <div className="panel stock-news">
            <div className="section-title">
              <h3>Market news</h3>
              <span className="tiny">SIMULATED STORIES</span>
            </div>
            <div className="scrolling-news">
              {s.news.map((n) => (
                <div className="news-item" key={n.id}>
                  <span className={`news-dot ${n.impact < 0 ? "red" : ""}`} />
                  <div>
                    <small>
                      {n.ticker} · {new Date(n.time).toLocaleString()}
                    </small>
                    <p>{n.headline}</p>
                  </div>
                  <span className={n.impact >= 0 ? "positive" : "negative"}>
                    {n.impact ? pct(n.impact * 100) : "LIVE"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <aside className="stock-order">
          <div className="panel">
            <div className="section-title">
              <h3>Invest in {c.ticker}</h3>
              <span className="tiny">MARKET CASH</span>
            </div>
            <div className="trade-actions">
              <button
                className={action === "buy" ? "active" : ""}
                onClick={() => setAction("buy")}
              >
                Buy shares
              </button>
              <button
                className={action === "sell" ? "active" : ""}
                onClick={() => setAction("sell")}
              >
                Sell shares
              </button>
            </div>
            <div className="detail-line">
              <span>Current share price</span>
              <b>{money(c.price)} MC</b>
            </div>
            <label className="quantity">
              Shares <span>Fractional · 4 decimals</span>
              <input
                aria-label="Stock shares"
                type="number"
                min=".0001"
                step=".0001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </label>
            <div className="quick-amounts">
              {[1, 5, 10].map((n) => (
                <button key={n} onClick={() => setShares(String(n))}>
                  {n}
                </button>
              ))}
              <button
                onClick={() =>
                  setShares(
                    String(
                      action === "buy"
                        ? Math.floor((g.cash / c.price) * 10000) / 10000
                        : holding?.shares || 0,
                    ),
                  )
                }
              >
                {action === "buy" ? "Buy Max" : "Sell All"}
              </button>
            </div>
            <div className="detail-line">
              <span>{action === "buy" ? "Cost" : "Proceeds"}</span>
              <b>{money(Number(shares) * c.price || 0)} MC</b>
            </div>
            <button
              className="primary"
              onClick={() => onTrade(c.ticker, action, Number(shares))}
            >
              {action === "buy" ? "Buy" : "Sell"} {c.ticker}{" "}
              <ArrowUpRight size={16} />
            </button>
            <p className="trade-disclaimer">
              Available: {money(g.cash)} MC · No fees
            </p>
            {holding && (
              <div className="position-card">
                <div className="section-title">
                  <span>YOUR SHARES</span>
                  <b>
                    {holding.shares.toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}
                  </b>
                </div>
                <div className="position-values">
                  <div>
                    <small>MARKET VALUE</small>
                    <strong>{money(value)}</strong>
                  </div>
                  <div>
                    <small>UNREALIZED P&L</small>
                    <strong className={pnl >= 0 ? "positive" : "negative"}>
                      {signed(pnl)}
                    </strong>
                    <small>
                      {pct((pnl / (holding.average * holding.shares)) * 100)}
                    </small>
                  </div>
                </div>
                <div className="detail-line">
                  <span>Average cost</span>
                  <b>{money(holding.average)}</b>
                </div>
                <div className="detail-line">
                  <span>Current price</span>
                  <b>{money(c.price)}</b>
                </div>
                <button
                  className="cashout"
                  onClick={() =>
                    onTrade(
                      c.ticker,
                      "sell",
                      Math.round(holding.shares * 10000) / 10000,
                    )
                  }
                >
                  SELL ALL {c.ticker}
                </button>
              </div>
            )}
            <div className="detail-line">
              <span>Realized stock P&L</span>
              <b>
                {signed(
                  s.trades
                    .filter((t) => t.ticker === ticker)
                    .reduce((sum, t) => sum + t.profit, 0),
                )}
              </b>
            </div>
          </div>
          <div className="panel tip">
            <Star size={18} />
            <div>
              <h4>Your time horizon is the advantage.</h4>
              <p>
                Momentum, company health, industry performance, and sentiment
                shape each five-minute move. Major events can reverse the trend.
              </p>
            </div>
          </div>
          <div className="safety">SIMULATION — FAKE MONEY ONLY</div>
        </aside>
      </div>
    </>
  );
}
