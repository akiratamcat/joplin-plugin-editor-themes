import { describe, expect, it } from "vitest"

import { PoParser } from "@joplin-plugin/i18n/PoParser"

describe("PoParser", () => {
  describe("parse", () => {
    it("parses entries and skips the header", () => {
      const po = [
        "# Comment",
        'msgid ""',
        'msgstr ""',
        '"Language: ja_JP\\n"',
        "",
        "#: src/file.ts",
        'msgid "Theme"',
        'msgstr "テーマ"',
        "",
        'msgid "High"',
        'msgstr "高"',
      ].join("\r\n")

      expect(PoParser.parse(po)).toStrictEqual(
        new Map([
          ["Theme", "テーマ"],
          ["High", "高"],
        ]),
      )
    })

    it("joins multi-line strings and unescapes sequences", () => {
      const po = [
        'msgid ""',
        '"Say \\"hi\\"\\n"',
        '"to Joplin\'s users"',
        'msgstr "A\\tB\\\\C"',
      ].join("\n")

      expect(PoParser.parse(po)).toStrictEqual(
        new Map([["Say \"hi\"\nto Joplin's users", "A\tB\\C"]]),
      )
    })

    it("parses consecutive entries without blank lines", () => {
      const po = ['msgid "A"', 'msgstr "1"', 'msgid "B"', 'msgstr "2"'].join("\n")

      expect(PoParser.parse(po)).toStrictEqual(
        new Map([
          ["A", "1"],
          ["B", "2"],
        ]),
      )
    })

    it("combines msgctxt with msgid", () => {
      const po = ['msgctxt "ctx"', 'msgid "A"', 'msgstr "1"'].join("\n")

      expect(PoParser.parse(po)).toStrictEqual(new Map([["ctx\u0004A", "1"]]))
    })

    it("skips fuzzy and untranslated entries", () => {
      const po = [
        "#, fuzzy",
        'msgid "A"',
        'msgstr "1"',
        "",
        'msgid "B"',
        'msgstr ""',
      ].join("\n")

      expect(PoParser.parse(po)).toStrictEqual(new Map())
    })
  })
})
