import type { NextConfig } from 'next'

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

module.exports = nextConfig
