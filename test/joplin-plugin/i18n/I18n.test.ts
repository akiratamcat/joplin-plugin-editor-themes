import { describe, expect, it } from "vitest"

import { I18n } from "@joplin-plugin/i18n/I18n"
import { PoFiles } from "@joplin-plugin/i18n/PoFiles"
import { PoParser } from "@joplin-plugin/i18n/PoParser"
import { createPluginSettingSection } from "@joplin-plugin/settings/PluginSettingSection"

const poFiles: I18n.PoFiles = {
  "de": 'msgid "Theme"\nmsgstr "Theme (de)"\n',
  "ja_JP": 'msgid "Theme"\nmsgstr "テーマ"\n',
  "zh_CN": 'msgid "Theme"\nmsgstr "主题"\n',
  "zh_TW": 'msgid "Theme"\nmsgstr "主題"\n',
}

describe("I18n", () => {
  describe("resolveLocale", () => {
    it.each([
      ["ja_JP", "ja_JP"],
      ["zh_TW", "zh_TW"],
      ["zh-cn", "zh_CN"],
      ["de_DE", "de"],
      ["de", "de"],
      ["ja", "ja_JP"],
    ])("resolves %s to %s", (locale, expected) => {
      expect(I18n.resolveLocale(locale, poFiles)).toBe(expected)
    })

    it.each([["en_US"], ["fr_FR"], [""], [undefined]])("resolves %s to nothing", (locale) => {
      expect(I18n.resolveLocale(locale, poFiles)).toBeUndefined()
    })
  })

  describe("create", () => {
    it("translates with the matching PO file", () => {
      const _ = I18n.create("ja_JP", poFiles)

      expect(_("Theme")).toBe("テーマ")
      expect(_("Untranslated")).toBe("Untranslated")
    })

    it("returns msgid as-is when no PO file matches", () => {
      const _ = I18n.create("en_US", poFiles)

      expect(_("Theme")).toBe("Theme")
    })
  })

  describe("bundled PO files", () => {
    const msgids = new Set<string>()
    const recorder = (msgid: string): string => {
      msgids.add(msgid)
      return msgid
    }
    createPluginSettingSection(recorder)

    it.each(Object.keys(PoFiles))("%s translates every UI string", (locale) => {
      const catalog = PoParser.parse(PoFiles[locale])

      expect([...catalog.keys()].sort((a, b) => a.localeCompare(b))).toStrictEqual(
        [...msgids].sort((a, b) => a.localeCompare(b)),
      )
    })
  })
})
