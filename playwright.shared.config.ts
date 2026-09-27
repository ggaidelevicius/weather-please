import { defineConfig } from '@playwright/test'

export default defineConfig({
	expect: { timeout: 5_000 },
	forbidOnly: Boolean(process.env.CI),
	fullyParallel: false,
	retries: 0,
	testDir: './e2e',
	testMatch: [
		'react-dashboard.spec.ts',
		'shared-resource.spec.ts',
		'temporal.spec.ts',
	],
	timeout: 20_000,
	workers: 1,
})
