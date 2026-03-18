import en from './en.json'
import zh from './zh.json'
import ja from './ja.json'

export const languages = {
    en: 'English',
    zh: '中文',
    ja: '日本語',
} as const

export type Lang = keyof typeof languages

const translations = { en, zh, ja }

export function t(lang: Lang, key: string): string {
    const dict = translations[lang] as Record<string, string>
    return dict[key] ?? key
}

export function getLangFromUrl(url: URL): Lang {
    const [, lang] = url.pathname.split('/')
    if (lang in languages) return lang as Lang
    return 'en'
}