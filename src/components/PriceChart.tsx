import { useState } from "react";

import { type Asset, type Position, type Trade, money } from "../engine";

import { price } from "../format";
export function PriceChart({
  a,
  trades,
  position,
}: {
  a: Asset;
  trades: Trade[];
  position?: Position;
}) {
  const [range, setRange] = useState("15M"),
    [hover, setHover] = useState<number | null>(null);
  const ranges: Record<string, number> = {
    "1M": 60000,
    "5M": 300000,
    "15M": 900000,
    "30M": 1800000,
    "1H": 3600000,
    MAX: Infinity,
  };
  let points = a.history.filter((p) => p.time >= Date.now() - ranges[range]);
  if (points.length < 2) points = a.history.slice(-2);
  if (points.length === 1)
    points = [{ ...points[0], time: points[0].time - 1000 }, points[0]];
  const low = Math.min(
      ...points.map((p) => p.price),
      position
        ? position.side === "NO"
          ? 1 - position.entry
          : position.entry
        : a.price,
    ),
    high = Math.max(
      ...points.map((p) => p.price),
      position
        ? position.side === "NO"
          ? 1 - position.entry
          : position.entry
        : a.price,
    ),
    pad = Math.max((high - low) * 0.2, a.kind === "stock" ? 0.1 : 0.005),
    min = low - pad,
    max = high + pad;
  const y = (v: number) => 170 - ((v - min) / (max - min)) * 140;
  const x = (t: number) =>
    ((t - points[0].time) / (points.at(-1)!.time - points[0].time || 1)) * 640;
  const path = points
    .map((p, i) => `${i ? "L" : "M"} ${x(p.time)} ${y(p.price)}`)
    .join(" ");
  const selected =
    hover !== null
      ? points[
          Math.min(points.length - 1, Math.round(hover * (points.length - 1)))
        ]
      : null;
  const up = a.price >= points[0].price;
  const markers = trades
    .filter((t) => t.asset === a.id && t.time >= points[0].time)
    .slice(0, 20);
  return (
    <div className="chart">
      <div className="chart-toolbar">
        <div>
          <span className="dot" />{" "}
          {selected ? price(a, selected.price) : price(a)}{" "}
          <small>
            {a.kind === "prediction" ? "YES PROBABILITY" : "SHARE PRICE"}
          </small>
        </div>
        <div className="ranges">
          {Object.keys(ranges).map((r) => (
            <button
              key={r}
              className={range === r ? "selected" : ""}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 700 205"
        role="img"
        aria-label={`${a.name} interactive price chart`}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHover(
            Math.max(
              0,
              Math.min(1, (e.clientX - rect.left) / ((rect.width * 640) / 700)),
            ),
          );
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`fill-${a.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor={up ? "#47e6b1" : "#ff7486"} stopOpacity=".22" />
            <stop
              offset="1"
              stopColor={up ? "#47e6b1" : "#ff7486"}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="0"
              x2="640"
              y1={30 + i * 46}
              y2={30 + i * 46}
              stroke="#232b3a"
              strokeDasharray="3 5"
            />
            <text x="649" y={34 + i * 46}>
              {price(a, max - ((max - min) * (i * 46 + 0)) / 140)}
            </text>
          </g>
        ))}
        <path d={`${path} L 640 190 L 0 190 Z`} fill={`url(#fill-${a.id})`} />
        <path
          d={path}
          fill="none"
          stroke={up ? "#47e6b1" : "#ff7486"}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {position && (
          <line
            x1="0"
            x2="640"
            y1={y(position.side === "NO" ? 1 - position.entry : position.entry)}
            y2={y(position.side === "NO" ? 1 - position.entry : position.entry)}
            stroke="#a78bfa"
            strokeDasharray="6 4"
          />
        )}
        {markers.map((t) => (
          <g key={t.id}>
            <circle
              cx={x(t.time)}
              cy={y(t.side === "NO" ? 1 - t.price : t.price)}
              r="5"
              fill={t.action === "buy" ? "#a78bfa" : "#fbbf24"}
            />
            <title>
              {t.action} {t.qty} at {money(t.price)}
            </title>
          </g>
        ))}
        {selected && (
          <g>
            <line
              x1={x(selected.time)}
              x2={x(selected.time)}
              y1="15"
              y2="190"
              stroke="#8793aa"
              strokeDasharray="3 3"
            />
            <circle
              cx={x(selected.time)}
              cy={y(selected.price)}
              r="5"
              fill="#fff"
            />
          </g>
        )}
        <circle
          cx="640"
          cy={y(a.price)}
          r="4"
          fill={up ? "#47e6b1" : "#ff7486"}
        />
        <text x="0" y="203">
          {new Date(points[0].time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </text>
        <text x="590" y="203">
          NOW
        </text>
      </svg>
      <div className="chart-legend">
        <span>
          <i className="purple" /> Buy / entry
        </span>
        <span>
          <i className="gold" /> Sell / cash out
        </span>
        <span>Hover to explore · Updates every second</span>
      </div>
    </div>
  );
}
