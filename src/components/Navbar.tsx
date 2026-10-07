import { useState } from "react";

import { Activity, BarChart3, Menu, Trophy, Wallet, Zap } from "lucide-react";
import { type Game, equity, money } from "../engine";

import { signed, tabs } from "../format";
import { netWorth } from "../investing";
export function Navbar({
  page,
  setPage,
  g,
}: {
  page: string;
  setPage: (p: string) => void;
  g: Game;
}) {
  const [open, setOpen] = useState(false);
  const kind = page === "Day Trading" ? "stock" : "prediction";
  const value = kind === "stock" ? equity(g, kind) : netWorth(g);
  return (
    <>
      <header>
        <a className="brand" onClick={() => setPage("Markets")} href="#">
          <span className="brand-icon">
            <Activity size={24} />
          </span>
          Market<span>Rush</span>
          <small>PLAY THE MARKET.</small>
        </a>
        <div className="header-wallet">
          <span>
            <small>
              {kind === "stock" ? "DAY PRACTICE CASH" : "MARKET CASH"}
            </small>
            <b>
              {money(kind === "stock" ? g.dayCash : g.cash)} <em>MC</em>
            </b>
          </span>
          <span>
            <small>PORTFOLIO VALUE</small>
            <b>{money(value)}</b>
          </span>
          <span>
            <small>TOTAL P&L</small>
            <b
              className={
                value >= (kind === "stock" ? 25000 : g.initialWorth)
                  ? "positive"
                  : "negative"
              }
            >
              {signed(value - (kind === "stock" ? 25000 : g.initialWorth))}
            </b>
          </span>
        </div>
        <button className="avatar" onClick={() => setPage("Profile")}>
          MR
        </button>
        <button
          className="mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setOpen(!open)}
        >
          <Menu />
        </button>
      </header>
      <nav className={open ? "open" : ""}>
        {tabs.map((t) => (
          <button
            key={t}
            className={page === t ? "active" : ""}
            onClick={() => {
              setPage(t);
              setOpen(false);
            }}
          >
            {t === "Markets" ? (
              <BarChart3 size={16} />
            ) : t === "Day Trading" ? (
              <Zap size={16} />
            ) : t === "Portfolio" ? (
              <Wallet size={16} />
            ) : t === "Leaderboard" ? (
              <Trophy size={16} />
            ) : null}
            {t}
            {t === "Day Trading" && <span className="tiny">FAST</span>}
          </button>
        ))}
        <span className="simulation">
          <span /> SIMULATION — FAKE MONEY ONLY
        </span>
      </nav>
    </>
  );
}
