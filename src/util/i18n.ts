import { i18n } from '@lingui/core'

export const locales: Record<string, string> = {
  de: 'Deutsch', // german
  en: 'English', // english
  es: 'Español', // spanish
  fr: 'Français', // french
  hi: 'हिंदी', // hindi
  it: 'Italiano', // italian
  ja: '日本語', // japanese
  ko: '한국인', // korean
  lt: 'Lietuvių', // lithuanian
  ru: 'русский', // russian
  vi: 'Tiếng Việt', // vietnamese
  zh: '中国人', // chinese
}

export const changeLocalisation = async (locale: keyof typeof locales): Promise<void> => {
  try {
    const { messages } = await import(`../locales/${locale}/messages`)
    i18n.load(locale, messages)
    i18n.activate(locale)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(e)
  }
}
