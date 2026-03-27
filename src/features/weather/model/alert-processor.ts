export interface AlertCondition {
	comparison: 'eq' | 'gte' | 'lte'
	hours: number
	threshold: number
}

export interface PrecipitationData {
	flag: boolean
	value: number
	zeroCount: number
}

export const processSimpleAlert = (
	data: number[],
	condition: AlertCondition,
): boolean[] => {
	const { comparison, hours, threshold } = condition

	return data.slice(0, hours).map((value) => {
		switch (comparison) {
			case 'eq':
				return value === threshold
			case 'gte':
				return value >= threshold
			case 'lte':
				return value <= threshold
			default:
				return false
		}
	})
}

export const processPrecipitationAlert = (
	precipitationData: number[],
): PrecipitationData => {
	return precipitationData.slice(0, 25).reduce(
		(acc: PrecipitationData, current: number) => {
			if (acc.flag) {
				return { ...acc, flag: true }
			}
			if (current === 0) {
				if (acc.zeroCount === 3) {
					return { ...acc, flag: true }
				}
				return {
					flag: false,
					value: acc.value,
					zeroCount: acc.zeroCount + 1,
				}
			}
			return { flag: false, value: acc.value + current, zeroCount: 0 }
		},
		{ flag: false, value: 0, zeroCount: 0 },
	)
}

/**
 * Determines the duration of a precipitation event by finding when it ends.
 * Returns a boolean array where `true` indicates the hour is part of the precipitation event,
 * and `false` indicates the event has ended.
 *
 * The event ends after 3 consecutive hours of zero precipitation. The 3 zero hours themselves
 * are included in the event (marked as `true`), and subsequent hours are marked as `false`.
 *
 * Example: [1, 0, 0, 0, 1] → [true, true, true, true, false]
 * - Hours 0-3 are part of the event (including the 3 consecutive zeros)
 * - Hour 4 onwards are marked as ended
 */
export const processPrecipitationDuration = (
	precipitationData: number[],
): boolean[] => {
	let negativeCount = 0
	return precipitationData.slice(0, 25).map((val: number) => {
		if (negativeCount === 3) {
			return false
		}
		if (val === 0) {
			negativeCount++
			return true
		}
		negativeCount = 0
		return true
	})
}

export const ALERT_CONDITIONS = {
	extremeUv: { comparison: 'gte' as const, hours: 13, threshold: 11 },
	lowVisibility: { comparison: 'lte' as const, hours: 25, threshold: 200 },
	strongWind: { comparison: 'gte' as const, hours: 25, threshold: 60 },
	strongWindGusts: { comparison: 'gte' as const, hours: 25, threshold: 80 },
} as const
