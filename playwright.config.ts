import { defineConfig } from '@playwright/test';
const port = process.env.PLAYWRIGHT_PORT ?? '3210';
const baseURL = `http://localhost:${port}`;
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1,
  use: { baseURL, viewport: { width: 1440, height: 1000 }, contextOptions: { reducedMotion: 'reduce' }, screenshot: 'only-on-failure' },
  webServer: { command: `npm run start -- --port ${port}`, url: baseURL, reuseExistingServer: !process.env.CI },
});
