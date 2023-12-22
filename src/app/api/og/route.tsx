/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const key = crypto.subtle.importKey(
	'raw',
	new TextEncoder().encode(process.env.OG_KEY),
	{ name: 'HMAC', hash: { name: 'SHA-256' } },
	false,
	['sign'],
)

const toHex = (arrayBuffer: ArrayBuffer) => {
	return Array.prototype.map
		.call(new Uint8Array(arrayBuffer), (n) => n.toString(16).padStart(2, '0'))
		.join('')
}

export const GET = async (request: Request) => {
	const { searchParams } = new URL(request.url)
	const title = searchParams.get('title')
	const description = searchParams.get('description')
	const token = searchParams.get('token')

	const verifyToken = toHex(
		await crypto.subtle.sign(
			'HMAC',
			await key,
			new TextEncoder().encode(JSON.stringify({ title })),
		),
	)

	if (token !== verifyToken) {
		return new Response('Invalid token', { status: 401 })
	}

	const robotoRegular = await fetch(
		`https://${process.env.VERCEL_URL}/fonts/Roboto-Regular.ttf`,
	).then((res) => res.arrayBuffer())
	const robotoBold = await fetch(
		`https://${process.env.VERCEL_URL}/fonts/Roboto-Bold.ttf`,
	).then((res) => res.arrayBuffer())

	return new ImageResponse(
		(
			<div
				style={{
					padding: '5rem',
					display: 'flex',
					backgroundColor: '#1a1b1e',
					width: '100%',
					height: '100%',
					flexDirection: 'column',
				}}
			>
				<h1
					style={{
						color: '#fff',
						fontWeight: '700',
						fontFamily: 'roboto',
						fontSize: '4rem',
						lineHeight: 1,
						maxWidth: '66%',
						marginBottom: '0.5rem',
					}}
				>
					{title}
				</h1>
				<p
					style={{
						color: '#c1c2c5',
						fontSize: '2rem',
						fontFamily: 'roboto',
						lineHeight: 1.5,
						maxWidth: '66%',
					}}
				>
					{description}
				</p>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						marginTop: 'auto',
						marginBottom: 0,
					}}
				>
					<svg
						width={60}
						height={60}
						style={{ marginRight: '1rem' }}
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 560.31 560.31"
					>
						<g>
							<circle
								style={{ fill: '#e2e3e4', strokeWidth: 0 }}
								cx="280.16"
								cy="280.16"
								r="280.16"
							/>
							<path
								style={{ fill: '#ee5e55', strokeWidth: 0 }}
								d="M516.09,366.32c-35.39,90.26-100.59,145.56-195.97,161.61-76.18,12.83-144.68-8.01-203.22-58.64-46.38-40.12-73.52-91.32-82.96-151.87-1.54-9.86-2.41-19.83-2.36-30.3.97-2.1,2.24-3.35,3.83-4.37,38.21-24.5,79.02-42.29,124.54-47.42,41.63-4.69,82.06.98,121.33,15.38,37.81,13.87,72.47,33.6,105.26,56.78,21.09,14.91,44.19,26,67.92,35.85,19.24,7.99,38.74,15.28,58.66,21.43.96.3,1.91.6,2.97,1.54Z"
							/>
							<path
								style={{ fill: '#20242a', strokeWidth: 0 }}
								d="M33.59,251.36C46.56,145.06,123.42,60.58,228.09,37.02c108.25-24.37,223.18,29.1,274.42,127.57,20.56,39.51,30.25,81.48,28.76,125.95-.54,16.15-2.55,32.16-6.69,48.28-2.47,1.7-4.7.76-6.91.06-28.15-8.95-55.65-19.59-82.17-32.59-13.16-6.45-25.63-14.17-37.68-22.6-31.09-21.76-63.87-40.47-99.31-54.32-28.75-11.24-58.47-18.63-89.24-20.83-41.09-2.95-81.06,2.8-119.65,17.49-17,6.47-33.48,14.06-49.23,23.2-1.99,1.16-3.9,2.65-6.82,2.12Z"
							/>
							<path
								style={{ fill: '#cf3629', strokeWidth: 0 }}
								d="M33.11,251.52c18.28-10.48,36.76-20,56.35-27.21,29.42-10.82,59.66-17.13,91.11-18.03,48.6-1.4,94.29,10.09,138.23,29.88,28.64,12.9,55.54,28.83,81.13,46.97,27.58,19.55,58.36,32.52,89.71,44.35,11.21,4.23,22.51,8.22,34.42,11.59-1.5,9.25-4.29,18.08-7.58,27.17-6.49.42-12.04-2.55-17.82-4.51-28.39-9.63-56.14-20.77-82.87-34.44-17.56-8.98-33.12-21.03-49.63-31.6-37.05-23.73-76-43.18-119.14-53.47-24.79-5.92-49.93-7.98-75.2-6.36-31.77,2.04-62.15,10.32-91.08,23.74-16.79,7.79-32.72,17.11-48.78,26.92-.97-11.52-.07-23.11,1.13-35.01Z"
							/>
						</g>
					</svg>
					<p
						style={{
							color: '#c1c2c5',
							fontWeight: '700',
							fontFamily: 'roboto',
							fontSize: '2.75rem',
							gap: '0.5rem',
						}}
					>
						Weather <span style={{ color: '#ea5e57' }}>Please</span>
					</p>
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					data: robotoRegular,
					name: 'roboto',
					style: 'normal',
					weight: 400,
				},
				{
					data: robotoBold,
					name: 'roboto',
					style: 'normal',
					weight: 700,
				},
			],
		},
	)
}
