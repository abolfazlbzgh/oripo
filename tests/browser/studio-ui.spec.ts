import { hydrationControl } from "./shell-helpers";
import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";
import { labPath, prerenderPaths } from "../../app/navigation";

test("appearance applies before hydration, survives navigation and reload, then defaults to light", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/en");
  const appearance = page.getByRole("checkbox", { name: "Dark mode" });
  await appearance.check();
  await page.getByRole("banner").getByRole("link", { name: "Guide", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Crease notation" })).toBeVisible();
  await expect(appearance).toBeChecked();
  // Use a fresh document so browser form-state restoration cannot enable the prerendered checkbox.
  await page.goto("about:blank");
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/assets/*.js", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/en/guide/crease-notation", { waitUntil: "commit" });
    await expect(appearance).toBeDisabled();
    await expect(page.locator(".wide-control .swap-on")).toHaveCSS("opacity", "1");
    await expect(page.locator(".wide-control .swap-off")).toHaveCSS("opacity", "0");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  } finally {
    release();
  }
  await expect(appearance).toBeEnabled();
  await expect(appearance).toBeChecked();
  await appearance.uncheck();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(appearance).not.toBeChecked();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  // Clearing the choice restores light, including on a dark OS.
  await page.evaluate(() => localStorage.removeItem("oripo-appearance"));
  await page.reload();
  await expect(appearance).not.toBeChecked();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  expect(errors).toEqual([]);
});

test("keyboard users can skip navigation, enter the studio and reverse without losing focus", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  const sceneRequests: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/scene.client-")) sceneRequests.push(req.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Explore", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Explore origami" })).toBeFocused();
  expect(sceneRequests).toHaveLength(0);
  await page.keyboard.press("Enter");
  await expect(page.locator("#models")).toBeFocused();
  // Inspect the lazy gallery images before deliberately leaving this document.
  for (const preview of await page.locator("#models img").all()) {
    await preview.scrollIntoViewIfNeeded();
    await preview.evaluate((img: HTMLImageElement) => img.decode());
  }
  expect(sceneRequests).toHaveLength(0);
  await page.goto(labPath);
  await expect(page.getByRole("heading", { name: "The first fold", exact: true })).toBeVisible();
  await page.getByRole("main").focus();
  const prev = page.getByRole("button", { name: "Previous", exact: true });
  const next = page.getByRole("button", { name: "Next", exact: true });
  await expect(next).toBeEnabled();
  await page.keyboard.press("Tab");
  await expect(prev).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(next).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText(/Fold complete/);
  await expect(next).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(prev).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("status")).toHaveText(/square again/);
  expect(sceneRequests).toHaveLength(1);
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`published documents and controls reflow at ${width}px with enlarged text`, async ({
    page,
    baseURL,
  }) => {
    const errors = watchBrowser(page, baseURL);
    await page.setViewportSize({ width, height: 840 });
    for (const path of prerenderPaths.filter(
      (path) => path === "/" || /^\/en(?:\/|$)/.test(path),
    )) {
      await page.goto(path);
      await expect(hydrationControl(page)).toBeEnabled();
      if (path === labPath || path.startsWith("/en/lessons/"))
        await expect(page.getByRole("button", { name: "Zoom in", exact: true })).toBeEnabled();
      for (const scale of ["100%", "200%"]) {
        const offscreen = await page.evaluate(
          ({ scale, width }) => {
            document.documentElement.style.fontSize = scale;
            const visibleControls = Array.from(
              document.querySelectorAll<HTMLElement>("a,button,select,summary,h1,h2,h3,h4"),
            ).filter((el) => el.getClientRects().length && !el.matches(".skip-link,.sr-only"));
            const clipped = visibleControls
              .filter((el) => {
                const box = el.getBoundingClientRect();
                return (
                  box.right > width + 0.5 ||
                  box.left < -0.5 ||
                  (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).display !== "inline")
                );
              })
              .map((el) => el.textContent?.trim());
            return { documentWidth: document.documentElement.scrollWidth, clipped };
          },
          { scale, width },
        );
        expect(offscreen, `${path} at ${scale}`).toEqual({ documentWidth: width, clipped: [] });
      }
    }
    expect(errors).toEqual([]);
  });
}
