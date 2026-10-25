import { defineConfig, devices } from '@playwright/test'

/** Dedicated port, so a dev or preview server left running is never mistaken for the test build. */
const PORT = 4317
const baseURL = `http://localhost:${PORT}`

/**
 * End-to-end tests run against the demo build, which ships the MSW mocks.
 * Every test gets a fresh browser context, so mock state and storage start clean.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  /**
   * Visual baselines live next to the specs, one set per operating system (font rendering
   * differs). A system without its set records it on the first run instead of failing.
   */
  updateSnapshots: 'missing',
  expect: {
    // Room for the whole suite running in parallel on a laptop; real failures still fail.
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.002,
    },
  },
  use: {
    baseURL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: `npm run build:demo && npx vite preview --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
