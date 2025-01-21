import { test, expect } from './fixtures';

test('widget closes the negative decision.', async ({ page }) => {
  const jobId = '42579330';
  await page.goto('https://news.ycombinator.com/item?id=42575537');

  // No comments are hidden initially.
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(0);

  await page.click(`tr[id='${jobId}'] a.hn-scout[data-job-status='no']`);

  // Automatic closure of the child comments on click.
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(1);

  await page.reload();

  // Change persists because of browser storage.
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(1);
});

test('widget allows to toggle the decision uncovering the post', async ({ page }) => {
  const jobId = '42579330';
  await page.goto('https://news.ycombinator.com/item?id=42575537');

  // No comments are hidden initially.
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(0);

  await page.click(`tr[id='${jobId}'] a.hn-scout[data-job-status='no']`);
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(1);

  await page.click(`tr[id='${jobId}'] a.hn-scout[data-job-status='yes']`);
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(0);
});

test('widget uncovers comments if same decision is un-selected', async ({ page }) => {
  const jobId = '42579330';
  await page.goto('https://news.ycombinator.com/item?id=42575537');

  // No comments are hidden initially.
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(0);

  await page.click(`tr[id='${jobId}'] a.hn-scout[data-job-status='no']`);
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(1);

  // Selecting same decision again uncovers the comments
  await page.click(`tr[id='${jobId}'] a.hn-scout[data-job-status='no']`);
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(0);

  await page.reload();

  // Change persists because of browser storage.
  expect(await page.locator(`tr[id='${jobId}'] td.nosee`).count()).toBe(0);
});

test('widget only is enabled on documents of who is hiring', async ({ page }) => {
  // the who is hiring page
  await page.goto('https://news.ycombinator.com/item?id=42575537');
  expect(await page.locator('a.hn-scout').count()).toBeGreaterThan(0);

  // a random page
  await page.goto('https://news.ycombinator.com/item?id=42769871');
  expect(await page.locator('a.hn-scout').count()).toBe(0);
});

test('widget correctly handles same month but different year posts', async ({ page }) => {
  // old post from January 2024
  const oldPostId = '38844766';
  await page.goto('https://news.ycombinator.com/item?id=38842977');

  await page.click(`tr[id='${oldPostId}'] a.hn-scout[data-job-status='no']`);
  await page.click("a.hn-scout.hn-scout-copy-share-link");
  const oldHash = await page.evaluate(() => { return window.location.hash });

  // new post from January 2025
  await page.goto('https://news.ycombinator.com/item?id=42575537');
  await page.click("a.hn-scout.hn-scout-copy-share-link");
  const newHash = await page.evaluate(() => { return window.location.hash });
  expect(oldHash).not.toBe(newHash);
});
