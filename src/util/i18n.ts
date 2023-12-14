import { i18n } from '@lingui/core'
import * as Sentry from '@sentry/nextjs'

interface Locale {
	[key: string]: {
		label: string
		privacy: string
	}
}

export const locales: Locale = {
	bn: {
		label: 'বাংলা', // bengali
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/bn/PRIVACY.md',
	},
	de: {
		label: 'Deutsch', // german
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/de/PRIVACY.md',
	},
	en: {
		label: 'English', // english
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/PRIVACY.md',
	},
	es: {
		label: 'Español', // spanish
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/es/PRIVACY.md',
	},
	fr: {
		label: 'Français', // french
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/fr/PRIVACY.md',
	},
	hi: {
		label: 'हिंदी', // hindi
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/hi/PRIVACY.md',
	},
	id: {
		label: 'Bahasa Indonesia', // indonesian
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/id/PRIVACY.md',
	},
	it: {
		label: 'Italiano', // italian
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/it/PRIVACY.md',
	},
	ja: {
		label: '日本語', // japanese
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/ja/PRIVACY.md',
	},
	ko: {
		label: '한국어', // korean
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/ko/PRIVACY.md',
	},
	lt: {
		label: 'Lietuvių', // lithuanian
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/lt/PRIVACY.md',
	},
	ru: {
		label: 'Русский', // russian
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/ru/PRIVACY.md',
	},
	vi: {
		label: 'Tiếng Việt', // vietnamese
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/vi/PRIVACY.md',
	},
	zh: {
		label: '中文', // chinese
		privacy:
			'https://github.com/ggaidelevicius/weather-please/blob/main/_locales/zh_CN/PRIVACY.md',
	},
}

export const changeLocalisation = async (
	locale: Extract<keyof typeof locales, string>,
	shareCrashesAndErrors: boolean,
): Promise<void> => {
	try {
		const { messages } = await import(`../locales/${locale}/messages`)
		i18n.load(locale, messages)
		i18n.activate(locale)
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(`Failed to load messages: ${e}`)
		if (shareCrashesAndErrors) {
			Sentry.captureException(e)
		}
	}
}
