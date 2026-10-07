import { test, expect, type Page } from "@playwright/test";
async function navigate(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  if (!(await button.isVisible()))
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await button.click();
}
async function saved(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("marketrush-v1")!),
  );
}
test("long-term fractional investing, five-minute update, watchlist, sale and net-worth ledger", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0.999;
  });
  await page.goto("/");
  await navigate(page, "Stock Market");
  await expect(
    page.getByRole("heading", { name: "Build something that lasts." }),
  ).toBeVisible();
  await expect(page.locator(".company-table tbody tr")).toHaveCount(33);
  await page
    .getByRole("button", { name: "Add NOVA to watchlist", exact: true })
    .click();
  await page.getByLabel("Stock industry").selectOption("Watchlist");
  await expect(page.locator(".company-table tbody tr")).toHaveCount(1);
  await page.getByLabel("Stock shares").fill("12.5");
  await page.getByRole("button", { name: "Buy NOVA", exact: true }).click();
  let g = await saved(page);
  expect(g.cash).toBeCloseTo(8946.875);
  expect(g.investing.holdings[0].shares).toBe(12.5);
  const initialPrice = g.investing.companies[0].price;
  const boundary = g.investing.lastUpdate;
  await page.reload();
  g = await saved(page);
  expect(g.cash).toBeCloseTo(8946.875);
  expect(g.investing.watchlist).toEqual(["NOVA"]);
  await navigate(page, "Stock Market");
  await page.clock.fastForward(300001);
  await expect
    .poll(async () => (await saved(page)).investing.lastUpdate)
    .toBe(boundary + 300000);
  g = await saved(page);
  expect(g.investing.lastUpdate).toBe(boundary + 300000);
  expect(g.investing.companies[0].price).not.toBe(initialPrice);
  await expect(page.locator(".update-clock strong")).toHaveText(/4:5\d/);
  await page.getByRole("button", { name: "Sell shares", exact: true }).click();
  await page.getByLabel("Stock shares").fill("2.5");
  await page.getByRole("button", { name: "Sell NOVA", exact: true }).click();
  g = await saved(page);
  expect(g.investing.holdings[0].shares).toBe(10);
  expect(g.transactions[0].label).toBe("NOVA STOCK SALE");
  await navigate(page, "Portfolio");
  await expect(
    page.getByText("Total net worth", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Market Cash transactions" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Long-term stock holdings" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "SELL ALL NOVA", exact: true })
    .click();
  expect((await saved(page)).investing.holdings).toHaveLength(0);
  await navigate(page, "Stock Market");
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `/tmp/marketrush-upgrade-stocks-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("all five arcade games settle, persist and record MC; blackjack survives a refresh", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Math.random = () => 0.999;
  });
  await page.goto("/");
  await navigate(page, "Casino");
  await expect(
    page.getByText("MARKET CASH ONLY — NO REAL MONEY OR PRIZES", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Deal $25.00 MC", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stand", exact: true }),
  ).toBeVisible();
  let g = await saved(page);
  expect(g.cash).toBe(9975);
  expect(g.arcade.blackjack.status).toBe("playing");
  await page.reload();
  await navigate(page, "Casino");
  expect((await saved(page)).cash).toBe(9975);
  await expect(
    page.getByRole("button", { name: "Stand", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stand", exact: true }).click();
  await expect(page.locator(".arcade-result")).toBeVisible();
  g = await saved(page);
  expect(g.cash).toBe(10000);
  expect(g.arcade.plays).toBe(1);
  for (const [name, button] of [
    ["Roulette", "Spin $25.00 MC"],
    ["Slots", "Spin reels · $25.00 MC"],
    ["High / Low", "↑ Higher"],
    ["Market Wheel", "Spin the market · $25.00 MC"],
  ]) {
    await page.locator(".casino-tile").filter({ hasText: name }).click();
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(page.locator(".arcade-result")).toBeVisible();
  }
  g = await saved(page);
  expect(g.arcade.plays).toBe(5);
  expect(
    g.transactions.filter((t: { wallet: string }) => t.wallet === "shared")
      .length,
  ).toBe(10);
  expect(g.cash).toBeGreaterThanOrEqual(0);
  const cash = g.cash;
  await page.reload();
  expect((await saved(page)).cash).toBe(cash);
  await navigate(page, "Casino");
  await page.locator(".casino-tile").filter({ hasText: "Slots" }).click();
  await page
    .getByRole("button", { name: "Claim daily 250 MC", exact: true })
    .click();
  expect((await saved(page)).cash).toBe(cash + 250);
  await expect(
    page.getByRole("button", { name: "Bonus already claimed" }),
  ).toBeDisabled();
  await page.getByLabel("Arcade play amount").fill("1001");
  await page
    .getByRole("button", { name: "Spin reels · $1,001.00 MC", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Choose a play amount" }),
  ).toBeVisible();
  expect((await saved(page)).cash).toBe(cash + 250);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `/tmp/marketrush-upgrade-casino-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("actual original-format save migrates without resetting the wallet", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Buy YES", exact: true }).click();
  const original = await saved(page);
  for (const key of [
    "schemaVersion",
    "investing",
    "arcade",
    "transactions",
    "transactionId",
    "initialWorth",
    "dailySnapshot",
    "dayProfitClaimed",
  ])
    delete original[key];
  await page.addInitScript(
    (save) => localStorage.setItem("marketrush-v1", JSON.stringify(save)),
    original,
  );
  await page.reload();
  const migrated = await saved(page);
  expect(migrated.cash).toBe(original.cash);
  expect(migrated.positions).toEqual(original.positions);
  expect(migrated.trades).toEqual(original.trades);
  expect(migrated.investing.companies).toHaveLength(33);
  await navigate(page, "Casino");
  await expect(
    page.getByRole("heading", { name: "Take a break. Play the rush." }),
  ).toBeVisible();
});
test("zero-cash recovery is free, persisted, and cannot overwrite invested value", async ({
  page,
}) => {
  await page.goto("/");
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("recovery-seeded")) {
      const g = JSON.parse(localStorage.getItem("marketrush-v1")!);
      g.cash = 0;
      localStorage.setItem("marketrush-v1", JSON.stringify(g));
      sessionStorage.setItem("recovery-seeded", "1");
    }
  });
  await page.reload();
  await navigate(page, "Casino");
  await page
    .getByRole("button", { name: "Recover 1,000 MC", exact: true })
    .click();
  expect((await saved(page)).cash).toBe(1000);
  await expect(
    page.getByRole("button", { name: "Recover 1,000 MC", exact: true }),
  ).toBeDisabled();
  await page.reload();
  expect((await saved(page)).cash).toBe(1000);
});
