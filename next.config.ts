import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
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

const sentryWebpackPluginOptions = {
	silent: true,
	org: 'gus-gaidelevicius-39581d35a',
	project: 'weather-please',
}

const sentryNextjsOptions = {
	widenClientFileUpload: true,
	hideSourceMaps: true,
	disableLogger: true,
}

module.exports = withSentryConfig(
	nextConfig,
	sentryWebpackPluginOptions,
	sentryNextjsOptions,
)
