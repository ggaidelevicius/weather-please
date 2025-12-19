import { describe, it, expect } from 'vitest'
import {
	processSimpleAlert,
	processPrecipitationAlert,
	processPrecipitationDuration,
	ALERT_CONDITIONS,
	type AlertCondition,
} from '../alert-processor'

describe('Alert Processor', () => {
	describe('processSimpleAlert', () => {
		it('processes greater than or equal conditions correctly', () => {
			const data = [5, 10, 15, 20, 25]
			const condition: AlertCondition = {
				threshold: 15,
				comparison: 'gte',
				hours: 5,
			}

			const result = processSimpleAlert(data, condition)

			expect(result).toEqual([false, false, true, true, true])
		})

		it('processes less than or equal conditions correctly', () => {
			const data = [5, 10, 15, 20, 25]
			const condition: AlertCondition = {
				threshold: 15,
				comparison: 'lte',
				hours: 5,
			}

			const result = processSimpleAlert(data, condition)

			expect(result).toEqual([true, true, true, false, false])
		})

		it('processes equal conditions correctly', () => {
			const data = [5, 10, 15, 20, 15]
			const condition: AlertCondition = {
				threshold: 15,
				comparison: 'eq',
				hours: 5,
			}

			const result = processSimpleAlert(data, condition)

			expect(result).toEqual([false, false, true, false, true])
		})

		it('limits results to specified hours', () => {
			const data = [5, 10, 15, 20, 25, 30, 35]
			const condition: AlertCondition = {
				threshold: 15,
				comparison: 'gte',
				hours: 3,
			}

			const result = processSimpleAlert(data, condition)

			expect(result).toHaveLength(3)
			expect(result).toEqual([false, false, true])
		})

		it('handles empty data array', () => {
			const data: number[] = []
			const condition: AlertCondition = {
				threshold: 15,
				comparison: 'gte',
				hours: 5,
			}

			const result = processSimpleAlert(data, condition)

			expect(result).toEqual([])
		})

		it('handles invalid comparison type', () => {
			const data = [5, 10, 15, 20, 25]
			const condition: AlertCondition = {
				threshold: 15,
				comparison: 'invalid' as AlertCondition['comparison'],
				hours: 5,
			}

			const result = processSimpleAlert(data, condition)

			expect(result).toEqual([false, false, false, false, false])
		})
	})

	describe('processPrecipitationAlert', () => {
		it('processes normal precipitation data', () => {
			const data = [1, 2, 3, 4, 5]

			const result = processPrecipitationAlert(data)

			expect(result).toEqual({
				value: 15,
				flag: false,
				zeroCount: 0,
			})
		})

		it('detects precipitation flag when zero count reaches 3', () => {
			const data = [1, 2, 0, 0, 0, 0, 3]

			const result = processPrecipitationAlert(data)

			expect(result).toEqual({
				value: 3,
				flag: true,
				zeroCount: 3,
			})
		})

		it('continues flagging after flag is set', () => {
			const data = [0, 0, 0, 0, 5, 10] // Flag should be set after 3 zeros

			const result = processPrecipitationAlert(data)

			expect(result.flag).toBe(true)
		})

		it('resets zero count on non-zero value', () => {
			const data = [1, 0, 0, 2, 0, 0] // Should not flag because zeros reset

			const result = processPrecipitationAlert(data)

			expect(result).toEqual({
				value: 3,
				flag: false,
				zeroCount: 2, // Current implementation keeps zeroCount for last zeros
			})
		})

		it('handles all-zero precipitation data', () => {
			const data = Array(25).fill(0)

			const result = processPrecipitationAlert(data)

			expect(result.flag).toBe(true)
			expect(result.value).toBe(0)
		})

		it('handles exactly 25 data points', () => {
			const data = Array(25).fill(1)

			const result = processPrecipitationAlert(data)

			expect(result).toEqual({
				value: 25,
				flag: false,
				zeroCount: 0,
			})
		})

		it('limits processing to first 25 data points', () => {
			const data = [...Array(25).fill(1), ...Array(10).fill(10)] // 35 total

			const result = processPrecipitationAlert(data)

			expect(result.value).toBe(25) // Only first 25 should be processed
		})
	})

	describe('processPrecipitationDuration', () => {
		it('processes normal precipitation duration', () => {
			const data = [1, 2, 3, 4, 5]

			const result = processPrecipitationDuration(data)

			expect(result).toEqual([true, true, true, true, true])
		})

		it('handles consecutive zeros correctly', () => {
			const data = [1, 0, 0, 0, 1] // 3 consecutive zeros should trigger end
			// The algorithm includes the 3 zeros in the duration, then marks subsequent hours as false
			// Result: first 4 hours (including the 3 zeros) are part of event, 5th hour is not

			const result = processPrecipitationDuration(data)

			expect(result).toEqual([true, true, true, true, false])
		})

		it('resets negative count on non-zero value', () => {
			const data = [1, 0, 0, 2, 0, 0, 0, 1] // Second set of zeros should trigger

			const result = processPrecipitationDuration(data)

			expect(result).toEqual([true, true, true, true, true, true, true, false])
		})

		it('handles all-zero data', () => {
			const data = Array(25).fill(0)

			const result = processPrecipitationDuration(data)

			// First 3 should be true, rest false
			const expected = [true, true, true, ...Array(22).fill(false)]
			expect(result).toEqual(expected)
		})

		it('handles mixed zero and non-zero data', () => {
			const data = [1, 2, 0, 0, 0, 0, 3, 4, 0, 0, 0, 0]

			const result = processPrecipitationDuration(data)

			// The function returns false once negativeCount reaches 3
			// For data [1, 2, 0, 0, 0, 0, 3, 4, 0, 0, 0, 0]:
			// Index 0: val=1, negativeCount=0 → returns true
			// Index 1: val=2, negativeCount=0 → returns true
			// Index 2: val=0, negativeCount→1 → returns true
			// Index 3: val=0, negativeCount→2 → returns true
			// Index 4: val=0, negativeCount→3 → returns true (3rd zero is still included)
			// Index 5: val=0, negativeCount=3 → returns false (check happens first)
			// Index 6+: All return false (precipitation event has ended)
			expect(result).toEqual([
				true,
				true,
				true,
				true,
				true, // The 3rd zero is still part of the event
				false, // 4th consecutive zero marks the end
				false,
				false,
				false,
				false,
				false,
				false,
			])
		})

		it('limits processing to first 25 data points', () => {
			const data = [...Array(25).fill(1), ...Array(10).fill(0)] // 35 total

			const result = processPrecipitationDuration(data)

			expect(result).toHaveLength(25)
			expect(result).toEqual(Array(25).fill(true))
		})
	})

	describe('ALERT_CONDITIONS', () => {
		it('contains correct extreme UV condition', () => {
			expect(ALERT_CONDITIONS.extremeUv).toEqual({
				threshold: 11,
				comparison: 'gte',
				hours: 13,
			})
		})

		it('contains correct strong wind condition', () => {
			expect(ALERT_CONDITIONS.strongWind).toEqual({
				threshold: 60,
				comparison: 'gte',
				hours: 25,
			})
		})

		it('contains correct strong wind gusts condition', () => {
			expect(ALERT_CONDITIONS.strongWindGusts).toEqual({
				threshold: 80,
				comparison: 'gte',
				hours: 25,
			})
		})

		it('contains correct low visibility condition', () => {
			expect(ALERT_CONDITIONS.lowVisibility).toEqual({
				threshold: 200,
				comparison: 'lte',
				hours: 25,
			})
		})
	})

	describe('Integration tests', () => {
		it('processes extreme UV alerts correctly', () => {
			const uvData = [8, 9, 10, 11, 12, 13, 10, 9, 8, 7, 6, 5, 4]

			const result = processSimpleAlert(uvData, ALERT_CONDITIONS.extremeUv)

			expect(result).toEqual([
				false,
				false,
				false,
				true,
				true,
				true,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
			])
		})

		it('processes strong wind alerts correctly', () => {
			const windData = Array(25)
				.fill(0)
				.map((_, i) => (i < 5 ? 70 : 30))

			const result = processSimpleAlert(windData, ALERT_CONDITIONS.strongWind)

			const expected = Array(25).fill(false)
			expected[0] = true
			expected[1] = true
			expected[2] = true
			expected[3] = true
			expected[4] = true

			expect(result).toEqual(expected)
		})

		it('processes low visibility alerts correctly', () => {
			const visibilityData = Array(25)
				.fill(0)
				.map((_, i) => (i < 3 ? 150 : 500))

			const result = processSimpleAlert(
				visibilityData,
				ALERT_CONDITIONS.lowVisibility,
			)

			const expected = Array(25).fill(false)
			expected[0] = true
			expected[1] = true
			expected[2] = true

			expect(result).toEqual(expected)
		})

		it('handles real-world precipitation scenario', () => {
			// Simulate a weather pattern: rain, then dry period, then rain again
			const precipitationData = [
				2, 1, 3, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 1, 2, 3, 0, 0, 0, 0, 1, 2, 3, 4,
				5,
			]

			const alertResult = processPrecipitationAlert(precipitationData)
			const durationResult = processPrecipitationDuration(precipitationData)

			expect(alertResult.flag).toBe(true) // Should flag due to 4 consecutive zeros
			expect(durationResult).toEqual([
				true,
				true,
				true,
				true,
				true,
				true,
				false, // After 3 zeros
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
			])
		})
	})
})
