import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	reactStrictMode: true,
	experimental: {
		swcPlugins: [['@lingui/swc-plugin', {}]],
		reactCompiler: true,
	},
	turbopack: {},
}

if (process.env.VERCEL !== '1') {
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
