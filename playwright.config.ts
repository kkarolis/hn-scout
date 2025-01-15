import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests-e2e',
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 1500,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
};

export default config; 