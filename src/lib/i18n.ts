import { i18n } from '@lingui/core'

export const locales = {
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
} as const satisfies Record<string, { label: string; privacy: string }>

export type LocaleKey = keyof typeof locales

type MessageModule = {
	messages: Record<string, string>
}

const localeMessageLoaders = {
	bn: () => import('../locales/bn/messages.js'),
	de: () => import('../locales/de/messages.js'),
	en: () => import('../locales/en/messages.js'),
	es: () => import('../locales/es/messages.js'),
	fr: () => import('../locales/fr/messages.js'),
	hi: () => import('../locales/hi/messages.js'),
	id: () => import('../locales/id/messages.js'),
	it: () => import('../locales/it/messages.js'),
	ja: () => import('../locales/ja/messages.js'),
	ko: () => import('../locales/ko/messages.js'),
	lt: () => import('../locales/lt/messages.js'),
	ru: () => import('../locales/ru/messages.js'),
	vi: () => import('../locales/vi/messages.js'),
	zh: () => import('../locales/zh/messages.js'),
} as const satisfies Record<LocaleKey, () => Promise<MessageModule>>

export const changeLocalisation = async (locale: LocaleKey): Promise<void> => {
	try {
		const { messages } = await localeMessageLoaders[locale]()
		i18n.load(locale, messages)
		i18n.activate(locale)
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(`Failed to load messages: ${e}`)
	}
}
