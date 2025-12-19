export interface AlertCondition {
	threshold: number
	comparison: 'gte' | 'lte' | 'eq'
	hours: number
}

export interface PrecipitationData {
	value: number
	flag: boolean
	zeroCount: number
}

export const processSimpleAlert = (
	data: number[],
	condition: AlertCondition,
): boolean[] => {
	const { threshold, comparison, hours } = condition

	return data.slice(0, hours).map((value) => {
		switch (comparison) {
			case 'gte':
				return value >= threshold
			case 'lte':
				return value <= threshold
			case 'eq':
				return value === threshold
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
					value: acc.value,
					flag: false,
					zeroCount: acc.zeroCount + 1,
				}
			}
			return { value: acc.value + current, flag: false, zeroCount: 0 }
		},
		{ value: 0, flag: false, zeroCount: 0 },
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
	extremeUv: { threshold: 11, comparison: 'gte' as const, hours: 13 },
	strongWind: { threshold: 60, comparison: 'gte' as const, hours: 25 },
	strongWindGusts: { threshold: 80, comparison: 'gte' as const, hours: 25 },
	lowVisibility: { threshold: 200, comparison: 'lte' as const, hours: 25 },
} as const
