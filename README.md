# MarketRush

A playable fictional prediction-market, stock-investing, day-trading, and arcade game. **Simulation — fake money only.** All currency is Market Cash (MC), with no real-world value. No payments, purchasable currency, deposits, withdrawals, cryptocurrency, or real-money prizes.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Vite serves the app on port 5173. No credentials, backend services, or environment variables are required. Fonts are bundled; gameplay uses no third-party APIs.

```sh
npm test          # original and new simulation/accounting/save tests
npm run build    # strict TypeScript check and production bundle
npm run preview  # serve the production bundle
npm run test:e2e # original and new desktop/mobile Chromium tests
npm run format   # format source and tests
```

Browser tests reuse `/usr/bin/chromium` when installed. Set `CHROMIUM_PATH` to another Chromium executable, or run `npx playwright install chromium` to use Playwright's bundled browser. GitHub Actions installs the browser and runs engine tests, build, and browser tests.

## Game modes

### Prediction markets

Start with **10,000 MC**. Buy YES or NO, sell partial quantities, or cash out. Prices refresh each second. Momentum, simulated activity, fictional news, time pressure, and mean reversion produce larger minute-level moves. Eight seeded fictional markets resolve after 6–27 minutes. The final simulated probability determines the random outcome. Winners settle at 1 MC, losers at zero. Open another round after every prediction resolves, preserving your wallet and history.

### Stock Market

Invest shared Market Cash in **33 fictional companies across 13 industries**, independent of the fast day-trading stocks. Buy fractional shares to four decimal places, average into positions, sell partially or sell all, star a watchlist, and screen by industry, gains/losses, market capitalization, and volatility.

A single central engine updates every **five real-world minutes**. Growth, volatility, momentum, company health, industry performance, market sentiment, and fictional news affect prices. Market-wide/sector events persist for three updates with decaying effects. Prices stay positive. MRX is the equal-weight average of company performance from a **10,000-point** launch baseline. Company and index charts support 1H, 6H, 1D, 1W, 1M, and ALL, with stored synthetic historical seed data clearly labelled and player trade markers.

Offline updates catch up at five-minute boundaries. At most the most recent seven days (2,016 updates) are simulated after a longer absence; this bounds work on lower-powered devices. Older history is compacted to daily points, recent two-day history retains five-minute samples, and a 35-day rolling window is retained. ALL means all retained history. News is fictional and timestamps reflect simulated update times.

### Day Trading

The existing **25,000 MC** practice account and ten-minute sessions remain intact. Six fictional stocks support long/short positions, partial sells/covers, stop-loss and take-profit. Opening/afternoon volatility surrounds a quieter midday. The closing bell settles all stock positions and keeps the final session result.

Day-practice principal is separate from shared net worth, so resetting a practice day never creates spendable principal. **Settled profit above 25,000 MC can transfer once to the shared wallet**. Starting the next session automatically transfers any unclaimed profit. Transfers are logged on both wallets. Practice losses do not debit shared currency.

Shorts reserve 100% entry-price collateral. Marked value is collateral plus entry-minus-current-price profit. Positions automatically cover when marked collateral is exhausted. Price gaps can exceed collateral or a stop threshold; orders execute at the next simulated quote.

### Arcade Casino

**MARKET CASH ONLY — NO REAL MONEY OR PRIZES.** Five working games use the shared wallet. Play amounts are 1–1,000 MC, with up to two decimals; overdrafts are rejected. All payout multipliers below include the returned play amount.

- **Blackjack:** one shuffled 52-card deck per hand; dealer stands on all 17s. Hit, stand, and double down on the first decision. A natural pays 2.5× total, ordinary wins 2×, and pushes 1×. No splits or insurance. Active hands, committed play amounts, and decks persist across refreshes; an unfinished hand cannot be replaced with a new deal. Settlement pays exactly once.
- **Roulette:** numbers 0–36, equally likely; exact numbers pay 36×; red/black/odd/even pay 2×. Zero is green and loses every category play.
- **Slots:** three independent, uniform six-symbol reels; a pair pays 1.5×, a triple pays 8×, no match pays zero.
- **High / Low:** a persistent 52-card deck drawn without replacement, reshuffled when empty. Ace is low. Correct predictions pay 1.6× initially, rising by 0.1× per consecutive win up to 2×. Equal ranks return the play amount and reset the streak. Each prediction is a separate play.
- **Market Wheel:** weighted outcomes 0× (38%), 0.5× (22%), 1× (20%), 1.25× (8%), 1.5× (6%), 2× (4%), 3× (2%). Segment art is decorative; the center reports the actual weighted result.

A shared daily **250 MC** bonus is available once per device-local calendar day from the profile or arcade. If shared net worth falls below 1 MC and no blackjack hand is active, a free **1,000 MC** recovery grant is always available. Players can recover repeatedly if they become broke again. No payment route exists.

## Shared wallet, portfolio, and saves

Predictions, long-term stocks, and arcade games share `cash`. Bonuses, achievements, and settled day profits credit that same wallet. The portfolio shows cash, long-term stocks, prediction positions, total shared net worth, today's/lifetime P&L, casino net result, day-practice equity, and best/worst held stocks by unrealized percentage return. Net-worth P&L includes grants, rewards, and transfers; today is measured from the first activity on each local calendar day. Day-practice principal is excluded. Active blackjack stakes are already debited and are not treated as guaranteed assets.

A balance-linked transaction ledger records purchases, proceeds, wagers, payouts (including zero outcomes), bonuses, achievements, practice resets, prediction resolution, recovery, and day-profit transfers. The latest 1,000 ledger entries and 1,000 stock trades are retained; cumulative casino statistics remain independent of those limits. Original prediction/day trade history and achievements remain available. Leaderboards still use fictional demo rivals; the player's row now uses cumulative shared net worth.

Saves stay at the original local-storage key, **`marketrush-v1`**, with `schemaVersion: 2` for new fields. Migration preserves original cash, practice cash, positions, trades, achievements, and profile while initializing only absent stock/arcade/ledger fields. Legacy net-worth P&L starts from migrated opening net worth; earlier trades remain in their original history rather than inventing historical wallet balances. New saves preserve holdings, watchlists, stock timestamps, arcade hands, and ledger entries.

Economic actions and five-minute market updates save immediately after React commits. Ordinary one-second price snapshots save every 15 seconds, with a final flush when hiding/leaving the page, avoiding large local-storage serialization every second. A storage failure is shown explicitly. Clearing browser data resets the simulation. Saves are local, editable, and not suitable for trusted online competition. There is no account, cross-device sync, or online multiplayer in this version.

## Architecture

React + TypeScript + Vite, extending the original component architecture:

- `src/engine.ts`: original prediction/day simulation, achievement rewards, central tick, and backward-compatible save migration.
- `src/investing.ts`: pure five-minute company/index engine with injected clock/randomness, watchlists, holdings, stock orders, and shared net-worth calculations. No React/browser dependencies; the update functions can be moved to a server or Supabase worker later.
- `src/arcade.ts`: pure game rules, cards/decks, exact-once blackjack settlement, arcade results, and free recovery.
- `src/wallet.ts`: shared/practice transaction ledger, daily bonus, and settled day-profit transfer.
- `src/components/`: original reusable components plus StockMarket, Casino, and WalletHistory.
- `src/style.css` / `src/upgrade.css`: original and additive responsive/reduced-motion styles. Charts use lightweight SVG; arcade animations use CSS transforms. One app timer drives all simulations.

The original tests remain unchanged. Additional engine tests cover five-minute timing, factors/events, offline catch-up, fractional accounting, net worth, watchlists, bonus/transfer idempotency, migration, every arcade payout path, overdrafts, blackjack refresh safety, and recovery. Browser tests cover all modes on desktop/mobile, stock persistence and settlement, all five games, actual legacy-save migration, recovery, and responsive overflow.
