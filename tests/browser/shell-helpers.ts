import { expect, type Page } from "@playwright/test";

export const hydrationControl = (page: Page) => page.locator(".theme-controller").first();
export async function setDark(page: Page, dark: boolean) {
  const mobile = page.getByRole("button", { name: "Site menu", exact: true });
  if (await mobile.isVisible()) await mobile.click();
  const checkbox = page.getByRole("checkbox", { name: "Dark mode", exact: true });
  await expect(checkbox).toBeEnabled();
  await checkbox.setChecked(dark);
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    dark ? "oripo-dark" : "oripo-light",
  );
  if (await mobile.isVisible()) await checkbox.press("Escape");
}
