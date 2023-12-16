let config = {
	reactStrictMode: true,
	experimental: {
		swcPlugins: [
			[
				'@lingui/swc-plugin',
				{
					// the same options as in .swcrc
				},
			],
		],
	},
}

if (process.env.NEXT_PUBLIC_BUILD_MODE === 'extension') {
	config = {
		reactStrictMode: true,
		experimental: {
			swcPlugins: [
				[
					'@lingui/swc-plugin',
					{
						// the same options as in .swcrc
					},
				],
			],
		},
		output: 'export',
		assetPrefix: '.',
		images: {
			unoptimized: true,
		},
	}
}

/** @type {import('next').NextConfig} */
const nextConfig = config

module.exports = nextConfig

// Injected content via Sentry wizard below

const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
	module.exports,
	{
		// For all available options, see:
		// https://github.com/getsentry/sentry-webpack-plugin#options

		// Suppresses source map uploading logs during build
		silent: true,

		org: 'gus-gaidelevicius-39581d35a',
		project: 'weather-please',
	},
	{
		// For all available options, see:
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

		// Upload a larger set of source maps for prettier stack traces (increases build time)
		widenClientFileUpload: true,

		// Hides source maps from generated client bundles
		hideSourceMaps: true,

		// Automatically tree-shake Sentry logger statements to reduce bundle size
		disableLogger: true,
	},
)
