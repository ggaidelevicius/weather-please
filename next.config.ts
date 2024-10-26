import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
	reactStrictMode: true,
	experimental: {
		swcPlugins: [['@lingui/swc-plugin', {}]],
	},
}

if (process.env.NEXT_PUBLIC_BUILD_MODE === 'extension') {
	Object.assign(nextConfig, {
		output: 'export',
		assetPrefix: '.',
		images: {
			unoptimized: true,
		},
	})
}

module.exports = withSentryConfig(nextConfig, {
	silent: true,
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,
	widenClientFileUpload: true,
	hideSourceMaps: true,
	disableLogger: true,
})
