# MarketRush

A polished, playable fictional prediction-market and day-trading game. **Simulation — fake money only.** No payments, deposits, withdrawals, cryptocurrency, or real-money prizes.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Vite serves the app on port 5173. No credentials, backend services, or environment variables are required. Fonts ship with the application; gameplay works without third-party APIs.

```sh
npm test          # simulation and accounting tests
npm run build    # strict TypeScript check and production bundle
npm run preview  # serve production bundle
npm run test:e2e # desktop and mobile Chromium browser tests
```

Browser tests use `/usr/bin/chromium` by default. Set `CHROMIUM_PATH` to your Chromium executable on other machines, or run `npx playwright install chromium` to use Playwright’s bundled browser. `npm run format` formats source and tests.

## Play

- Prediction wallet: **10,000 MC**. Buy YES or NO, sell partial quantities, or cash out. Prices refresh each second; momentum, simulated activity, news, time pressure, and mean reversion produce larger minute-level moves. Eight seeded fictional markets resolve after 6–27 minutes. The final simulated probability determines the random outcome. Winners settle at 1 MC, losers at zero. After every prediction resolves, open a new round without resetting your wallet.
- Day trading: **25,000 MC** per ten-minute session. Six fictional stocks, long/short positions, partial sells/covers, stop-loss and take-profit. Opening and afternoon volatility surround a quieter midday. All stock positions close at the final bell. Play another day to reset the stock wallet while preserving prediction progress.
- Shorts reserve 100% entry-price collateral. Marked value is collateral plus entry-minus-current-price profit. Positions automatically cover when marked collateral is exhausted. A price gap can exceed collateral or a stop threshold; orders execute at the next simulated quote.
- Large orders (over 5,000 MC or 25% of mode equity) require confirmation and execute against the current quote, which can move during confirmation.
- Local profiles, trade history, achievements, and a daily 250 MC bonus. Achievement rewards credit the prediction wallet once. Daily bonuses follow your device's local calendar date.
- Leaderboard rivals are explicitly fictional demo data. Your row uses live, cumulative local prediction equity; period filters change the demo rivals, not your history.

## Architecture and persistence

React + TypeScript + Vite. `src/engine.ts` is the simulated data layer and pure trading/accounting engine. `src/main.tsx` manages application state; `src/components/` contains reusable UI components, including Navbar, MarketCard, PriceChart, TradingPanel, PositionCard, CashOutModal, DayTradingPanel, Portfolio, NewsFeed, and Leaderboard. `src/style.css` provides responsive styles and reduced-motion support.

State persists in browser local storage (`marketrush-v1`); there is no account, online multiplayer, or cross-device synchronization in this first version. Returning to a saved game settles expired markets and closes expired trading days. Background/offline price movement is deliberately bounded rather than replaying every missed tick. Clearing browser data resets progress. Client-side saves are editable and unsuitable for competitive rankings.

Tests cover accounting, complementary NO prices, averaging, partial sales, payout idempotency, collateral and cover, automatic exits, market close, wallet separation, achievement rewards, invalid orders, desktop/mobile interaction, persistence, navigation, charts, and responsive overflow.
