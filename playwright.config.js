const { defineConfig, devices } = require('@playwright/test');

const portfolioPort = Number(process.env.PORTFOLIO_PORT || 49173);
const portfolioURL = `http://127.0.0.1:${portfolioPort}`;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'portfolio-production.spec.js',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: portfolioURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: portfolioURL,
    reuseExistingServer: false,
    timeout: 15_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }
  ],
  reporter: [['list']]
});
