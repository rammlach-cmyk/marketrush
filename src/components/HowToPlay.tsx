export function HowToPlay() {
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">QUICK TO LEARN. HARD TO PUT DOWN.</div>
        <h1>
          Play the odds. Own the moment<span>.</span>
        </h1>
        <p>
          MarketRush is a fictional market simulation. All balances and payouts
          are fake Market Cash.
        </p>
      </div>
      <div className="how-grid">
        {[
          [
            "01",
            "Pick your prediction",
            "Buy YES if you believe the fictional event will happen, or NO if you think it won’t. A 63¢ YES contract represents a 63% simulated probability.",
          ],
          [
            "02",
            "Watch the market move",
            "Prices refresh every second. Every minute, momentum, simulated trading activity, fictional news, and time remaining drive a larger move. Green is up. Red is down.",
          ],
          [
            "03",
            "Hold or cash out",
            "100 YES contracts at 55¢ cost 55 MC. At 70¢, they’re worth 70 MC: a 15 MC profit. Sell any quantity or cash out the entire position.",
          ],
          [
            "04",
            "Resolution pays automatically",
            "When the countdown ends, a simulated outcome is drawn using the final probability. Winning contracts pay 1 MC each. Losing contracts pay zero.",
          ],
          [
            "05",
            "Trade the ten-minute day",
            "Start with 25,000 MC, trade six fictional stocks, and experience an opening rush, quiet midday, and volatile afternoon. The closing bell settles all positions.",
          ],
          [
            "06",
            "Short with care",
            "Shorts reserve the share price as collateral. Profit is entry minus current price. Cover to close; stop-loss and take-profit execute at the next simulated price, so gaps can exceed your stop.",
          ],
        ].map(([n, title, body]) => (
          <div className="panel" key={n}>
            <span className="step">{n}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
      <div className="day-banner">
        <h3>Fake money. Real quick thinking.</h3>
        <p>
          No deposits, withdrawals, crypto, purchasable Market Cash, or
          real-money prizes. This is a local single-player simulation with demo
          rivals, not financial advice. Daily bonuses and achievement rewards go
          to your prediction wallet. New trading days reset only the day-trading
          wallet.
        </p>
      </div>
    </>
  );
}
