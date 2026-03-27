import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: { qualities: [100] },
	reactCompiler: true,
}

if (process.env.VERCEL !== '1') {
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
