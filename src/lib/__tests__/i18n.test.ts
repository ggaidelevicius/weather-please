import { locales } from '../i18n'
import { describe, it, expect } from 'vitest'

describe('i18n', () => {
	describe('locales', () => {
		it('contains all expected locale keys', () => {
			const expectedLocales = [
				'bn',
				'de',
				'en',
				'es',
				'fr',
				'hi',
				'id',
				'it',
				'ja',
				'ko',
				'lt',
				'ru',
				'vi',
				'zh',
			]
			const actualLocales = Object.keys(locales)

			expectedLocales.forEach((locale) => {
				expect(actualLocales).toContain(locale)
			})
		})

		it('has label and privacy properties for each locale', () => {
			Object.values(locales).forEach((locale) => {
				expect(locale).toHaveProperty('label')
				expect(locale).toHaveProperty('privacy')
				expect(typeof locale.label).toBe('string')
				expect(typeof locale.privacy).toBe('string')
				expect(locale.privacy).toMatch(/^https:\/\/github\.com\//)
			})
		})

		it('privacy URLs follow expected pattern', () => {
			Object.entries(locales).forEach(([key, locale]) => {
				if (key === 'en') {
					expect(locale.privacy).toBe(
						'https://github.com/ggaidelevicius/weather-please/blob/main/PRIVACY.md',
					)
				} else if (key === 'zh') {
					expect(locale.privacy).toBe(
						'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/zh_CN/PRIVACY.md',
					)
				} else {
					expect(locale.privacy).toBe(
						`https://github.com/ggaidelevicius/weather-please/blob/main/_locales/${key}/PRIVACY.md`,
					)
				}
			})
		})

		it('contains expected number of locales', () => {
			expect(Object.keys(locales)).toHaveLength(14)
		})
	})
})
