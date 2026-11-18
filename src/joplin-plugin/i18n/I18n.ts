import { PoParser } from "@joplin-plugin/i18n/PoParser"

/**
 * Translates the UI string {@link msgid} into the current language.
 * Returns {@link msgid} as-is when no translation exists.
 */
export type Translate = (msgid: string) => string

/**
 * Gettext-style UI translation based on PO files.
 */
export namespace I18n {
  /**
   * Maps Joplin locale codes (e.g. `ja_JP`, `zh_CN`, `de_DE`) to PO file contents.
   */
  export type PoFiles = Readonly<Record<string, string>>

  /**
   * Translation that returns every `msgid` as-is (English).
   */
  export const identity: Translate = (msgid) => msgid

  /**
   * Returns the key of {@link poFiles} that best matches the Joplin {@link locale},
   * or `undefined` when no PO file matches.
   *
   * Matching order:
   * 1. Exact match (`zh_TW` -\> `zh_TW`)
   * 2. Language-only PO file (`de_DE` -\> `de`)
   * 3. Any PO file with the same language (`ja` -\> `ja_JP`)
   */
  export function resolveLocale(locale: string | undefined, poFiles: PoFiles): string | undefined {
    if (locale === undefined || locale === "") return undefined

    const normalized = locale.replace(/-/g, "_")
    const keys = Object.keys(poFiles)

    const exact = keys.find((key) => key.toLowerCase() === normalized.toLowerCase())
    if (exact !== undefined) return exact

    const [language] = normalized.toLowerCase().split("_")
    const languageOnly = keys.find((key) => key.toLowerCase() === language)
    if (languageOnly !== undefined) return languageOnly

    return keys.find((key) => key.toLowerCase().split("_")[0] === language)
  }

  /**
   * Creates a {@link Translate} function for the Joplin {@link locale} from {@link poFiles}.
   * Falls back to {@link identity} (English) when no PO file matches.
   */
  export function create(locale: string | undefined, poFiles: PoFiles): Translate {
    const key = resolveLocale(locale, poFiles)
    if (key === undefined) return identity

    const catalog = PoParser.parse(poFiles[key])
    return (msgid) => catalog.get(msgid) ?? msgid
  }
}
