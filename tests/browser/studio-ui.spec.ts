import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";
import { publishedPaths } from "../../app/navigation";

test("appearance applies before hydration, survives navigation and reload, then follows the system", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/en");
  const appearance = page.getByRole("combobox", { name: "Appearance" });
  await appearance.selectOption("oripo-dark");
  await page.getByRole("link", { name: "Crease notation", exact: true }).click();
  await expect(appearance).toHaveValue("oripo-dark");
  // Use a fresh document so browser form-state restoration cannot enable the prerendered select.
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
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  } finally {
    release();
  }
  await expect(appearance).toBeEnabled();
  await expect(appearance).toHaveValue("oripo-dark");
  await appearance.selectOption("oripo-light");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(appearance).toHaveValue("oripo-light");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await appearance.selectOption("system");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.reload();
  await expect(appearance).toHaveValue("system");
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
  await expect(page.getByRole("link", { name: "Explore", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Open the 3D studio" })).toBeFocused();
  expect(sceneRequests).toHaveLength(0);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "The first fold", exact: true })).toBeVisible();
  await expect(page.getByRole("main")).toBeFocused();
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
    for (const path of publishedPaths) {
      await page.goto(path);
      await expect(page.getByLabel("Appearance")).toBeEnabled();
      for (const scale of ["100%", "200%"]) {
        const offscreen = await page.evaluate(
          ({ scale, width }) => {
            document.documentElement.style.fontSize = scale;
            const visibleControls = Array.from(
              document.querySelectorAll<HTMLElement>("a,button,select,h1,h2,h3"),
            ).filter((el) => el.getClientRects().length && !el.classList.contains("skip-link"));
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
