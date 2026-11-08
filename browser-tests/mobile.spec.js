import { test, expect } from "@playwright/test";

async function enterFight(page) {
  await page.goto("/");
  await page.getByRole("button", { name: /ENTER THE ARENA/i }).click();
  await expect(page.locator("#fight-screen")).toBeVisible();
}

async function centerOf(locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Touch target has no visible bounding box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test("portrait shows rotate prompt and landscape reveals the arena controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterFight(page);

  const hint = page.locator(".rotate-hint");
  await expect(hint).toBeVisible();
  await expect(page.locator(".touch-controls")).toHaveCSS("display", "flex");

  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.evaluate(() => matchMedia("(orientation: landscape)").matches)).toBe(true);
  await expect(hint).toBeHidden();
  await expect(page.locator("#game-canvas")).toBeVisible();
  await expect(page.locator(".touch-controls")).toBeVisible();
  await expect(page.locator('[data-key="l"]')).toBeDisabled();
});

test("mobile touch controls are visible and accept simultaneous multi-touch presses", async ({ page, context }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await enterFight(page);

  const controls = page.locator(".touch-controls");
  await expect(controls).toHaveCSS("display", "flex");

  const left = page.locator('[data-key="a"]');
  const guard = page.locator('[data-key="i"]');
  const punch = page.locator('[data-key="j"]');
  const kick = page.locator('[data-key="k"]');

  const session = await context.newCDPSession(page);
  const first = await centerOf(left);
  const second = await centerOf(punch);
  const third = await centerOf(kick);

  // Send genuine Chromium touch-input protocol events with distinct contact IDs.
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...first, id: 11 }]
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...first, id: 11 }, { ...second, id: 22 }]
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...first, id: 11 }, { ...second, id: 22 }, { ...third, id: 33 }]
  });

  await expect(left).toHaveClass(/active/);
  await expect(punch).toHaveClass(/active/);
  await expect(kick).toHaveClass(/active/);

  // A fourth contact can hold guard while the other three remain pressed.
  const fourth = await centerOf(guard);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { ...first, id: 11 },
      { ...second, id: 22 },
      { ...third, id: 33 },
      { ...fourth, id: 44 }
    ]
  });
  await expect(guard).toHaveClass(/active/);
  await expect(left).toHaveClass(/active/);
  await expect(punch).toHaveClass(/active/);
  await expect(kick).toHaveClass(/active/);

  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(left).not.toHaveClass(/active/);
  await expect(guard).not.toHaveClass(/active/);
  await expect(punch).not.toHaveClass(/active/);
  await expect(kick).not.toHaveClass(/active/);
  await session.detach();
});
