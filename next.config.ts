import type { NextConfig } from 'next'

import { CONTENT_SIGNAL } from './src/features/landing/model/site'

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_WEATHER_PLEASE_BUILD_TARGET:
			process.env.WEATHER_PLEASE_BUILD_TARGET === 'extension'
				? 'extension'
				: 'web',
	},
	experimental: {
		turbopackGc: process.env.NODE_ENV === 'development',
		turbopackLazyDynamicImports: true,
		useTypeScriptCli: true,
	},
	async headers() {
		return [
			{
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
				source: '/bug',
			},
			...[
				{ contentType: 'text/markdown', source: '/auth.md' },
				{ contentType: 'text/plain', source: '/llms.txt' },
				{ contentType: 'text/plain', source: '/robots.txt' },
			].map(({ contentType, source }) => ({
				headers: [
					{ key: 'Content-Type', value: `${contentType}; charset=utf-8` },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Content-Signal', value: CONTENT_SIGNAL },
				],
				source,
			})),
		]
	},
	images: { qualities: [100] },
	reactCompiler: true,
}

if (process.env.WEATHER_PLEASE_BUILD_TARGET === 'extension') {
	Object.assign(nextConfig, {
		assetPrefix: '.',
		// Static export can't send headers, and the extension has no pages to
		// describe to crawlers.
		headers: undefined,
		images: {
			qualities: [100],
			unoptimized: true,
		},
		output: 'export',
	} as NextConfig)
}

export default nextConfig
