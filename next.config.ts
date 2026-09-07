import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_WEATHER_PLEASE_BUILD_TARGET:
			process.env.WEATHER_PLEASE_BUILD_TARGET === 'extension'
				? 'extension'
				: 'web',
	},
	experimental: {
		useTypeScriptCli: true,
	},
	images: { qualities: [100] },
	reactCompiler: true,
}

if (process.env.WEATHER_PLEASE_BUILD_TARGET === 'extension') {
	Object.assign(nextConfig, {
		assetPrefix: '.',
		images: {
			qualities: [100],
			unoptimized: true,
		},
		output: 'export',
	} as NextConfig)
}

export default nextConfig
