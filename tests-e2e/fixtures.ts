import { test as base, chromium, type BrowserContext } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  page: async ({ page }, use) => {
    page.on('console', msg => console.log(msg.text()));
    page.on('pageerror', exception => {
        console.error(`Uncaught exception: ${exception}`);
    });
    await use(page);
  },
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '../dist');
    console.log('pathToExtension', pathToExtension);
    const context = await chromium.launchPersistentContext('', {
      // needed for extensions to work
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent('serviceworker');

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});
export const expect = test.expect;