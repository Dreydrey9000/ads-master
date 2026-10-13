import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://localhost:3210', viewport: { width: 1440, height: 1000 }, contextOptions: { reducedMotion: 'reduce' }, screenshot: 'only-on-failure' },
  webServer: { command: 'npm run start -- --port 3210', url: 'http://localhost:3210', reuseExistingServer: !process.env.CI },
});
