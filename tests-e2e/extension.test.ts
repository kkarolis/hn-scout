import { test, expect } from './fixtures';

test('widget hides comments when clicked and persists', async ({ page }) => {
  await page.goto('https://news.ycombinator.com/item?id=42575537');

  // No comments are hidden initially.
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(0);

  await page.click("tr[id='42579330'] a.hn-job-decision[data-job-status='yes']");

  // Automatic closure of the child comments on click.
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(1);

  await page.reload();

  // Change persists because of browser storage.
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(1);
});

test('widget allows to toggle the decision without uncovering the comments', async ({ page }) => {
  await page.goto('https://news.ycombinator.com/item?id=42575537');

  // No comments are hidden initially.
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(0);
  await page.click("tr[id='42579330'] a.hn-job-decision[data-job-status='yes']");

  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(1);
  await page.click("tr[id='42579330'] a.hn-job-decision[data-job-status='no']");
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(1);
});

test('widget uncovers comments if same decision is un-select is persisted', async ({ page }) => {
  await page.goto('https://news.ycombinator.com/item?id=42575537');

  // No comments are hidden initially.
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(0);
  await page.click("tr[id='42579330'] a.hn-job-decision[data-job-status='yes']");
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(1);

  // Selecting same decision again uncovers the comments
  await page.click("tr[id='42579330'] a.hn-job-decision[data-job-status='yes']");
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(0);

  await page.reload();

  // Change persists because of browser storage.
  expect(await page.locator("tr[id='42579330'] td.nosee").count()).toBe(0);
});
