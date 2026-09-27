import { z } from 'zod'

export const deviceLocationResultSchema = z.discriminatedUnion('status', [
	z.object({
		lat: z.number().min(-90).max(90),
		lon: z.number().min(-180).max(180),
		status: z.literal('success'),
	}),
	z.object({
		code: z.enum([
			'permission-denied',
			'position-unavailable',
			'timeout',
			'unsupported',
		]),
		status: z.literal('error'),
	}),
])

export type DeviceLocationResult = z.infer<typeof deviceLocationResultSchema>

export const fetchDeviceLocation = ({
	signal,
}: Readonly<{ signal: AbortSignal }>): Promise<DeviceLocationResult> =>
	new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new DOMException('Location check was cancelled', 'AbortError'))
			return
		}
		if (!navigator.geolocation) {
			resolve({ code: 'unsupported', status: 'error' })
			return
		}

		let isSettled = false
		const handleAbort = () => {
			isSettled = true
			reject(new DOMException('Location check was cancelled', 'AbortError'))
		}
		const finish = (result: DeviceLocationResult) => {
			if (isSettled || signal.aborted) return
			isSettled = true
			signal.removeEventListener('abort', handleAbort)
			resolve(result)
		}
		signal.addEventListener('abort', handleAbort, { once: true })
		try {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const parsed = deviceLocationResultSchema.safeParse({
						lat: position.coords.latitude,
						lon: position.coords.longitude,
						status: 'success',
					})
					finish(
						parsed.success
							? parsed.data
							: { code: 'position-unavailable', status: 'error' },
					)
				},
				(error) =>
					finish({
						code:
							error.code === 1
								? 'permission-denied'
								: error.code === 3
									? 'timeout'
									: 'position-unavailable',
						status: 'error',
					}),
				{ timeout: 20_000 },
			)
		} catch {
			finish({ code: 'position-unavailable', status: 'error' })
		}
	})
