import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	reactCompiler: true,
	reactStrictMode: true,
	turbopack: {},
}

if (process.env.VERCEL !== '1') {
	Object.assign(nextConfig, {
		output: 'export',
		assetPrefix: '.',
		images: {
			unoptimized: true,
		},
	} as NextConfig)
}

module.exports = nextConfig
