import { defineConfig } from '@lingui/cli'

export default defineConfig({
	catalogs: [
		{
			include: ['src'],
			path: '<rootDir>/src/locales/{locale}/messages',
		},
	],
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
})
