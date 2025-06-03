import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	reactStrictMode: true,
	experimental: {
		swcPlugins: [['@lingui/swc-plugin', {}]],
		reactCompiler: true,
	},
	turbopack: {},
}

if (process.env.NEXT_PUBLIC_DEMO === 'false') {
	Object.assign(nextConfig, {
		output: 'export',
		assetPrefix: '.',
		images: {
			unoptimized: true,
		},
		experimental: {
			reactCompiler: true,
		},
		turbopack: {},
	})
}

module.exports = nextConfig
