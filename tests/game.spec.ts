import { test, expect } from "@playwright/test";
test("prediction trading, partial sell, cash-out, persistence and navigation", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your next move starts here." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Buy YES", exact: true }).click();
  await expect(page.getByText("100 contracts", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("100 contracts", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sell", exact: true }).click();
  await page.getByLabel("Trade quantity").fill("40");
  await page.getByRole("button", { name: "Sell YES", exact: true }).click();
  await expect(page.getByText("60 contracts", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "CASH OUT", exact: true }).click();
  await expect(page.getByText("60 contracts", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Trade history" }),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Claim 250 MC" }).click();
  await expect(
    page.getByRole("button", { name: "Bonus claimed" }),
  ).toBeDisabled();
  await page.screenshot({
    path: `/tmp/marketrush-${testInfo.project.name}-profile.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("day trading short/cover and time-compressed market close", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: /Day Trading/ }).click();
  await page.getByRole("button", { name: "Ring the opening bell" }).click();
  await page.getByRole("button", { name: /Short.*84/ }).click();
  await page.getByLabel("Trade quantity").fill("10");
  await page.getByRole("button", { name: "Short NOVA", exact: true }).click();
  await expect(page.getByText("10 shares", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cover", exact: true }).click();
  await page.getByRole("button", { name: "Cover NOVA", exact: true }).click();
  await expect(page.getByText("10 shares", { exact: true })).toHaveCount(0);
  await page.clock.fastForward(601000);
  await expect(
    page.getByRole("heading", { name: "Closing bell. How did you do?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play another day" }),
  ).toBeVisible();
});
test("markets search, chart controls and desktop screenshot", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByLabel("Search markets").fill("Luna");
  await expect(page.locator(".market-card")).toHaveCount(1);
  await page.locator(".market-card").click();
  await expect(page.locator(".featured h2")).toHaveText(
    "Will Luna release a surprise single?",
  );
  await page.getByRole("button", { name: "1M", exact: true }).click();
  await page.getByLabel("Search markets").fill("");
  await page.screenshot({
    path: `/tmp/marketrush-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("large order confirmation retains live prices; prediction round settles and restarts", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByLabel("Trade quantity").fill("5000");
  await page.getByRole("button", { name: "Buy YES", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.clock.fastForward(61000);
  await page.getByRole("button", { name: "Confirm trade" }).click();
  await expect(page.getByText("5000 contracts", { exact: true })).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("marketrush-v1")!),
  );
  const latest = stored.trades[0];
  expect(latest.price).toBeCloseTo(
    stored.assets.find((a: { id: string }) => a.id === "COMETS").price,
    4,
  );
  await page.clock.fastForward(1800000);
  await expect(
    page.getByRole("button", { name: "Open next round" }),
  ).toBeVisible();
  await expect(page.getByText("5000 contracts", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Open next round" }).click();
  await expect(
    page.getByRole("button", { name: "Buy YES", exact: true }),
  ).toBeEnabled();
});
