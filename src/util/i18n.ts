import { i18n } from '@lingui/core'

export const locales: Record<string, string> = {
  en: 'English',
  hi: 'हिंदी',
  lt: 'Lietuvių',
  vi: 'Tiếng Việt',
}

export const changeLocalisation = async (locale: keyof typeof locales) => {
  try {
    const { messages } = await import(`../locales/${locale}/messages`)
    i18n.load(locale, messages)
    i18n.activate(locale)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(e)
  }
}
