import {
  ArrowUpRight,
  Gift,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  blackjackAction,
  cardLabel,
  highLow,
  marketWheel,
  recovery,
  RED,
  roulette,
  score,
  slots,
  startBlackjack,
  WHEEL,
  type Card,
  type RouletteChoice,
} from "../arcade";
import { money, type Game } from "../engine";
import { signed } from "../format";
import { netWorth } from "../investing";
import { claimDaily } from "../wallet";
type Action = (fn: (g: Game) => Game, message?: string) => void;
const games = [
  {
    name: "Blackjack",
    symbol: "♠",
    tag: "PLAY YOUR HAND",
    description: "Twenty-one is the target. Your next card changes everything.",
  },
  {
    name: "Roulette",
    symbol: "◎",
    tag: "PICK YOUR MOMENT",
    description:
      "A fictional 37-number wheel. Pick a number, color, or parity.",
  },
  {
    name: "Slots",
    symbol: "🚀",
    tag: "THREE OF A KIND",
    description: "Market-themed reels. Match a pair or hit a triple.",
  },
  {
    name: "High / Low",
    symbol: "↕",
    tag: "TRUST YOUR INSTINCT",
    description: "Higher or lower? Build your streak, boost your payout.",
  },
  {
    name: "Market Wheel",
    symbol: "✦",
    tag: "A LITTLE MARKET CHAOS",
    description: "Seven multipliers. One spin. Pure arcade energy.",
  },
];
function PlayingCard({
  card,
  hidden = false,
}: {
  card?: Card;
  hidden?: boolean;
}) {
  return (
    <div
      className={`playing-card ${hidden ? "face-down" : card?.suit === "♥" || card?.suit === "♦" ? "red-suit" : ""}`}
      aria-label={
        hidden ? "Hidden dealer card" : card ? cardLabel(card) : "Card"
      }
    >
      {hidden ? (
        <span>MR</span>
      ) : (
        <>
          <b>
            {card?.rank === 1
              ? "A"
              : card?.rank === 11
                ? "J"
                : card?.rank === 12
                  ? "Q"
                  : card?.rank === 13
                    ? "K"
                    : card?.rank}
          </b>
          <strong>{card?.suit}</strong>
          <small>{card && cardLabel(card)}</small>
        </>
      )}
    </div>
  );
}
function Result({ g, name }: { g: Game; name: string }) {
  const r = g.arcade.last;
  if (!r || r.game !== name) return null;
  return (
    <div
      className={`arcade-result ${r.payout >= r.wager ? "win" : "loss"}`}
      role="status"
      key={`${r.time}-${g.arcade.plays}`}
    >
      <Sparkles size={18} />
      <div>
        <strong>{r.message}</strong>
        <p>
          Play {money(r.wager)} MC · Payout {money(r.payout)} MC · Net{" "}
          <b>{signed(r.payout - r.wager)} MC</b>
        </p>
      </div>
    </div>
  );
}
function BlackjackGame({
  g,
  bet,
  onAction,
}: {
  g: Game;
  bet: number;
  onAction: Action;
}) {
  const hand = g.arcade.blackjack,
    playing = hand?.status === "playing";
  return (
    <>
      <div className="card-table">
        <div className="hand-label">
          DEALER{" "}
          <span>
            {hand && !playing ? score(hand.dealer) : "Stands on all 17s"}
          </span>
        </div>
        <div className="cards">
          {hand ? (
            hand.dealer.map((card, i) => (
              <PlayingCard key={i} card={card} hidden={playing && i > 0} />
            ))
          ) : (
            <>
              <PlayingCard hidden />
              <PlayingCard hidden />
            </>
          )}
        </div>
        <div className="table-inscription">MARKETRUSH ♠ BLACKJACK</div>
        <div className="hand-label">
          YOUR HAND{" "}
          <span>{hand ? score(hand.player) : "Ready when you are"}</span>
        </div>
        <div className="cards">
          {hand ? (
            hand.player.map((card, i) => <PlayingCard key={i} card={card} />)
          ) : (
            <div className="card-placeholder">Deal in to begin</div>
          )}
        </div>
        {hand && (
          <p className="stake">
            Committed play amount: <b>{money(hand.bet)} MC</b>
          </p>
        )}
      </div>
      {playing ? (
        <div className="arcade-actions">
          <button
            className="primary"
            onClick={() => onAction((s) => blackjackAction(s, "hit"))}
          >
            Hit
          </button>
          <button
            className="secondary"
            onClick={() => onAction((s) => blackjackAction(s, "stand"))}
          >
            Stand
          </button>
          <button
            className="secondary"
            disabled={hand.player.length !== 2 || g.cash < hand.bet}
            onClick={() => onAction((s) => blackjackAction(s, "double"))}
          >
            Double Down
          </button>
        </div>
      ) : (
        <button
          className="primary"
          onClick={() => onAction((s) => startBlackjack(s, bet))}
        >
          Deal {money(bet)} MC <ArrowUpRight size={16} />
        </button>
      )}
      <Result g={g} name="Blackjack" />
      <p className="game-rules">
        One shuffled 52-card deck per hand. Aces count as 1 or 11. Dealer stands
        on soft 17. Natural blackjack pays 3:2 profit; ordinary wins pay 1:1
        profit; a push returns your play amount. Double down on your first
        decision for one final card. No splits or insurance.
      </p>
    </>
  );
}
function RouletteGame({
  g,
  bet,
  onAction,
}: {
  g: Game;
  bet: number;
  onAction: Action;
}) {
  const [choice, setChoice] = useState<RouletteChoice>("red"),
    [number, setNumber] = useState("7");
  const last = g.arcade.last?.game === "Roulette" ? g.arcade.last : null;
  return (
    <>
      <div className="roulette-stage">
        <div
          className={`roulette-ring ${last ? "wheel-played" : ""}`}
          key={last ? `${last.time}-${g.arcade.plays}` : "initial"}
        >
          <div
            className={`wheel-center ${last?.number === 0 ? "green" : last && RED.has(last.number!) ? "red" : "black"}`}
          >
            <small>SIMULATED WHEEL</small>
            <strong>{last?.number ?? "?"}</strong>
            <small>0–36 · 37 POCKETS</small>
          </div>
        </div>
        <span className="wheel-pointer">▼</span>
      </div>
      <div className="roulette-options">
        {(["red", "black", "odd", "even", "number"] as RouletteChoice[]).map(
          (c) => (
            <button
              className={choice === c ? "selected" : ""}
              key={c}
              onClick={() => setChoice(c)}
            >
              {c === "red"
                ? "● Red"
                : c === "black"
                  ? "● Black"
                  : c === "number"
                    ? "Number"
                    : c}
            </button>
          ),
        )}
      </div>
      {choice === "number" && (
        <label className="number-choice">
          Choose a pocket (0–36)
          <input
            aria-label="Roulette number"
            type="number"
            min="0"
            max="36"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </label>
      )}
      <button
        className="primary"
        onClick={() =>
          onAction((s) => roulette(s, bet, choice, Number(number)))
        }
      >
        Spin {money(bet)} MC <Zap size={16} />
      </button>
      <Result g={g} name="Roulette" />
      <p className="game-rules">
        Every number is equally likely. A correct number returns 36× your play
        amount (35:1 profit). Red, black, odd, and even return 2×. Zero is green
        and loses all category plays. All payouts are fictional MC.
      </p>
    </>
  );
}
function SlotsGame({
  g,
  bet,
  onAction,
}: {
  g: Game;
  bet: number;
  onAction: Action;
}) {
  const last = g.arcade.last?.game === "Slots" ? g.arcade.last : null;
  return (
    <>
      <div className="slot-machine">
        <div className="slot-title">
          RUSH REELS <span>✦</span>
        </div>
        <div
          className="slot-reels"
          key={last ? `${last.time}-${g.arcade.plays}` : "initial"}
        >
          {(last?.symbols || ["📈", "💎", "🚀"]).map((s, i) => (
            <div
              className={last ? "reel spun" : "reel"}
              style={{ animationDelay: `${i * 0.06}s` }}
              key={i}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="slot-lights">● ● ● ● ● ● ● ● ● ● ● ●</div>
      </div>
      <button
        className="primary"
        onClick={() => onAction((s) => slots(s, bet))}
      >
        Spin reels · {money(bet)} MC <Zap size={16} />
      </button>
      <Result g={g} name="Slots" />
      <div className="payout-strip">
        <span>
          PAIR <b>1.5×</b>
        </span>
        <span>
          TRIPLE <b>8×</b>
        </span>
        <span>
          NO MATCH <b>0×</b>
        </span>
      </div>
      <p className="game-rules">
        Six equally likely symbols on three independent reels. Any pair returns
        1.5× your play amount; three matching symbols return 8×. Spins settle
        once and save immediately.
      </p>
    </>
  );
}
function HighLowGame({
  g,
  bet,
  onAction,
}: {
  g: Game;
  bet: number;
  onAction: Action;
}) {
  const h = g.arcade.highLow;
  return (
    <>
      <div className="high-low-stage">
        <div className="streak-pill">
          <Trophy size={15} /> {h.streak}-WIN STREAK
        </div>
        <p>Will the next card be higher or lower?</p>
        <PlayingCard card={h.current} />
        <div className="rank-scale">A = 1 · J = 11 · Q = 12 · K = 13</div>
      </div>
      <div className="arcade-actions">
        <button
          className="primary"
          onClick={() => onAction((s) => highLow(s, bet, "higher"))}
        >
          ↑ Higher
        </button>
        <button
          className="secondary"
          onClick={() => onAction((s) => highLow(s, bet, "lower"))}
        >
          ↓ Lower
        </button>
      </div>
      <Result g={g} name="High / Low" />
      <p className="game-rules">
        Draws use a 52-card deck without replacement; a fresh deck is shuffled
        when empty. A correct prediction returns 1.6×, increasing by 0.1× per
        consecutive win up to 2×. Equal ranks return your play amount and reset
        the streak. Each prediction is a separate paid play.
      </p>
    </>
  );
}
function MarketWheelGame({
  g,
  bet,
  onAction,
}: {
  g: Game;
  bet: number;
  onAction: Action;
}) {
  const last = g.arcade.last?.game === "Market Wheel" ? g.arcade.last : null;
  return (
    <>
      <div className="market-wheel-stage">
        <div
          className={`market-wheel-disc ${last ? "wheel-played" : ""}`}
          key={last ? `${last.time}-${g.arcade.plays}` : "initial"}
        >
          {WHEEL.map((s, i) => (
            <span
              key={s.value}
              style={{
                transform: `rotate(${(i * 360) / 7}deg) translateY(-109px) rotate(-${(i * 360) / 7}deg)`,
              }}
            >
              {s.value}×
            </span>
          ))}
          <div className="wheel-center">
            <small>MARKET WHEEL</small>
            <strong>{last ? `${last.multiplier}×` : "MR"}</strong>
            <small>MARKET CASH ONLY</small>
          </div>
        </div>
        <span className="wheel-pointer">▼</span>
      </div>
      <button
        className="primary"
        onClick={() => onAction((s) => marketWheel(s, bet))}
      >
        Spin the market · {money(bet)} MC <Sparkles size={16} />
      </button>
      <Result g={g} name="Market Wheel" />
      <div className="wheel-odds">
        {WHEEL.map((s) => (
          <span key={s.value}>
            <b>{s.value}×</b> {s.weight}%
          </span>
        ))}
      </div>
      <p className="game-rules">
        Segment art is decorative; the weighted odds above determine outcomes. A
        multiplier applies to the total payout, so 1× returns your play amount
        and 0× returns nothing. The pointer animation is for game feel; the
        central number is the result.
      </p>
    </>
  );
}
export function Casino({ g, onAction }: { g: Game; onAction: Action }) {
  const [game, setGame] = useState("Blackjack"),
    [bet, setBet] = useState("25");
  const chosen = games.find((c) => c.name === game)!;
  const claimed = g.bonusDate === new Date().toDateString(),
    playing = g.arcade.blackjack?.status === "playing";
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} /> MARKETRUSH ARCADE CASINO
          </div>
          <h1>
            Take a break. Play the rush<span>.</span>
          </h1>
          <p>
            Five arcade games. The same fictional Market Cash. No real-money
            connection.
          </p>
        </div>
        <div className="arcade-wallet">
          <small>SHARED MARKET CASH</small>
          <strong>
            {money(g.cash)} <em>MC</em>
          </strong>
        </div>
      </div>
      <div className="arcade-warning">
        <ShieldCheck size={19} />
        <strong>MARKET CASH ONLY — NO REAL MONEY OR PRIZES</strong>
        <span>No payments. No purchasable currency. No withdrawals.</span>
      </div>
      <div className="casino-lobby">
        {games.map((c) => (
          <button
            className={`casino-tile ${c.name === game ? "active" : ""}`}
            key={c.name}
            onClick={() => setGame(c.name)}
          >
            <span className="casino-symbol">{c.symbol}</span>
            <strong>{c.name}</strong>
            <small>{c.tag}</small>
            {c.name === "Blackjack" && playing && (
              <span className="tiny">HAND IN PROGRESS</span>
            )}
          </button>
        ))}
      </div>
      <div className="arcade-layout">
        <section className="panel arcade-game">
          <div className="section-title">
            <div>
              <div className="eyebrow">{chosen.tag}</div>
              <h2>{chosen.name}</h2>
              <p>{chosen.description}</p>
            </div>
            <span className="tiny">FICTIONAL GAME</span>
          </div>
          {game === "Blackjack" ? (
            <BlackjackGame g={g} bet={Number(bet)} onAction={onAction} />
          ) : game === "Roulette" ? (
            <RouletteGame g={g} bet={Number(bet)} onAction={onAction} />
          ) : game === "Slots" ? (
            <SlotsGame g={g} bet={Number(bet)} onAction={onAction} />
          ) : game === "High / Low" ? (
            <HighLowGame g={g} bet={Number(bet)} onAction={onAction} />
          ) : (
            <MarketWheelGame g={g} bet={Number(bet)} onAction={onAction} />
          )}
        </section>
        <aside className="arcade-sidebar">
          <div className="panel">
            <div className="section-title">
              <h3>Your play amount</h3>
              <span className="tiny">MC ONLY</span>
            </div>
            <label className="quantity">
              Market Cash per play
              <input
                aria-label="Arcade play amount"
                type="number"
                min="1"
                max="1000"
                step=".01"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                disabled={game === "Blackjack" && playing}
              />
            </label>
            <div className="quick-amounts">
              {[10, 25, 100, 500].map((n) => (
                <button
                  disabled={game === "Blackjack" && playing}
                  key={n}
                  onClick={() => setBet(String(n))}
                >
                  {n} MC
                </button>
              ))}
            </div>
            <p>
              1–1,000 MC per play. You can never spend more than your available
              balance.
            </p>
            <div className="detail-line">
              <span>Casino net result</span>
              <b className={g.arcade.net >= 0 ? "positive" : "negative"}>
                {signed(g.arcade.net)} MC
              </b>
            </div>
            <div className="detail-line">
              <span>Completed plays</span>
              <b>{g.arcade.plays}</b>
            </div>
            {playing && (
              <p className="active-hand-note">
                Your blackjack hand is saved. Return to Blackjack to finish it.
              </p>
            )}
          </div>
          <div className="panel daily-arcade">
            <Gift size={25} />
            <h3>Daily Market Cash bonus</h3>
            <p>
              250 MC. Free, once per local calendar day. The same bonus as your
              profile.
            </p>
            <button
              className="primary"
              disabled={claimed}
              onClick={() =>
                onAction((s) => claimDaily(s), "+250 MC · Daily boost claimed!")
              }
            >
              {claimed ? "Bonus already claimed" : "Claim daily 250 MC"}
            </button>
          </div>
          <div className="panel recovery">
            <h3>A fresh start is always free.</h3>
            <p>
              If your shared net worth drops below 1 MC, claim 1,000 MC to
              restart. Sell holdings or finish an active hand first. No payment,
              ever.
            </p>
            <button
              className="secondary"
              disabled={netWorth(g) >= 1 || playing}
              onClick={() =>
                onAction(
                  (s) => recovery(s),
                  "+1,000 MC · Free simulation recovery",
                )
              }
            >
              Recover 1,000 MC
            </button>
          </div>
          <div className="safety">
            <ShieldCheck size={14} /> Market Cash has no real-world value.
          </div>
        </aside>
      </div>
    </>
  );
}
