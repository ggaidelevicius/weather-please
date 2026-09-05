import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	workers: 1,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	use: {
		baseURL: 'http://127.0.0.1:3100',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	webServer: {
		command: 'pnpm start --hostname 127.0.0.1 --port 3100',
		url: 'http://127.0.0.1:3100',
		reuseExistingServer: false,
		timeout: 60_000,
	},
})
