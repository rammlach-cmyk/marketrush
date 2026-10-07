import { money, type Asset } from "./engine";
export const signed = (v: number) =>
  `${v >= 0 ? "+" : "−"}${money(Math.abs(v))}`;
export const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
export const price = (a: Asset, v = a.price) =>
  a.kind === "prediction" ? `${(v * 100).toFixed(1)}¢` : money(v);
export const remaining = (ms: number) =>
  `${Math.max(0, Math.floor(ms / 60000))}:${String(Math.max(0, Math.floor(ms / 1000) % 60)).padStart(2, "0")}`;
export const tabs = [
  "Markets",
  "Day Trading",
  "Portfolio",
  "Leaderboard",
  "Profile",
  "How to Play",
];
