/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en', 'lt', 'vi', 'hi'],
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
}
