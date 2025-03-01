import { defineConfig } from '@lingui/cli'

export default defineConfig({
	locales: [
		'en',
		'lt',
		'vi',
		'hi',
		'zh',
		'ja',
		'es',
		'de',
		'fr',
		'it',
		'ko',
		'ru',
		'bn',
		'id',
	],
	catalogs: [
		{
			path: '<rootDir>/src/locales/{locale}/messages',
			include: ['src'],
		},
	],
	format: 'po',
})
