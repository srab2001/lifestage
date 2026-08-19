import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Phase 8 hardening (design doc Section 8.2.9): an automated accessibility
// pass across the static/public pages. Auth-gated (/dashboard) and
// token-gated (/third-party/[token] with a valid token) pages need a real
// session or submission to reach, so they're out of scope for this static
// check — this covers what every visitor can reach unauthenticated.
const PAGES = ["/", "/apply", "/schema", "/third-party/invalid-token", "/under-the-hood"];

for (const path of PAGES) {
  test(`${path} has no automatically detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
}
