import { test, expect } from './fixtures';

test('example test', async ({ page }) => {
  page.on('console', msg => console.log(msg.text()));
  page.on('pageerror', exception => { console.error(`Uncaught exception: ${exception}`); });

  await page.goto('https://news.ycombinator.com/item?id=42575537');

  // No comments are hidden initially.
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(0);

  await page.click("tr[id='42579330'] a.hn-job-decision");

  // Automatic closure of the child comments on click.
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(1);

  await page.reload();

  // Change persists because of browser storage.
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(1);
});
