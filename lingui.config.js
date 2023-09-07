/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en', 'lt', 'vi', 'hi', 'zh', 'ja', 'es', 'de', 'fr', 'it', 'ko'],
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
}
