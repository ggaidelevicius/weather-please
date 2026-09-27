import { defineConfig } from '@playwright/test'

export default defineConfig({
	forbidOnly: Boolean(process.env.CI),
	fullyParallel: false,
	retries: process.env.CI ? 1 : 0,
	testDir: './e2e',
	use: {
		baseURL: 'http://127.0.0.1:3100',
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
	},
	webServer: {
		command: 'pnpm start --hostname 127.0.0.1 --port 3100',
		reuseExistingServer: false,
		timeout: 60_000,
		url: 'http://127.0.0.1:3100',
	},
	workers: 1,
})
