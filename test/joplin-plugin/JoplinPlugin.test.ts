import JoplinContentScripts from "api/JoplinContentScripts"
import JoplinPlugins from "api/JoplinPlugins"
import { ContentScriptType, Script } from "api/types"
import { It, mock, when } from "strong-mock"
import { Dicts } from "@ts-belt"
import { describe, expect, it } from "vitest"

import { CmExtensionClient } from "@cm-extension-ipc/CmExtensionClient"

import { RequestHandler } from "@joplin-plugin/handler/RequestHandler"
import { I18n } from "@joplin-plugin/i18n/I18n"
import { PoFiles } from "@joplin-plugin/i18n/PoFiles"
import { JoplinPlugin } from "@joplin-plugin/JoplinPlugin"
import { PluginSettings } from "@joplin-plugin/settings/PluginSettings"
import { createPluginSettingSection } from "@joplin-plugin/settings/PluginSettingSection"

import { FakeJoplinSettings } from "test-support/fakes/joplin/FakeJoplinSettings"

describe("JoplinPlugin", () => {
  const mockCmExtensionClient = mock<CmExtensionClient>()
  const mockJoplinContentScripts = mock<JoplinContentScripts>()
  const mockJoplinPlugins = mock<JoplinPlugins>()
  const mockRequestHandler = mock<RequestHandler>()

  async function startPlugin(locale: string | undefined): Promise<FakeJoplinSettings> {
    const fakeJoplinSettings = FakeJoplinSettings.create({ globalValues: { locale } })

    const captureScript = It.willCapture<Script>()
    when(() => mockJoplinPlugins.register(captureScript)).thenResolve()

    await JoplinPlugin.register<PluginSettings>({
      cmExtensionClient: mockCmExtensionClient,
      contentScript: {
        id: "id",
        path: "path",
      },
      joplin: {
        contentScripts: mockJoplinContentScripts,
        plugins: mockJoplinPlugins,
        settings: fakeJoplinSettings,
      },
      requestHandler: mockRequestHandler,
      createSettingSection: createPluginSettingSection,
      poFiles: PoFiles,
    })

    const captureMessageHandler = It.willCapture<unknown>()
    when(() =>
      mockJoplinContentScripts.register(ContentScriptType.CodeMirrorPlugin, "id", "path"),
    ).thenResolve()
    when(() => mockJoplinContentScripts.onMessage("id", captureMessageHandler)).thenResolve()

    await captureScript.value!.onStart!(undefined)

    return fakeJoplinSettings
  }

  describe("register", () => {
    it("register onStart", async () => {
      const fakeJoplinSettings = await startPlugin("en_GB")
      const settingSection = createPluginSettingSection(I18n.identity)

      expect(fakeJoplinSettings.ext.settingSections).toContainExactlyEntry(
        "EditorThemesI18n",
        Dicts.deleteKey(settingSection, "settings"),
      )
      expect(fakeJoplinSettings.ext.settingItems).toStrictEqual(
        new Map(
          Object.entries(
            Dicts.map(settingSection.settings, (setting) => ({
              ...setting,
              section: "EditorThemesI18n",
            })),
          ),
        ),
      )
    })

    it("localizes the setting section according to the Joplin locale", async () => {
      const fakeJoplinSettings = await startPlugin("ja_JP")

      expect(fakeJoplinSettings.ext.settingSections.get("EditorThemesI18n")?.label).toBe(
        "エディターテーマ",
      )
      const themePrecedence = fakeJoplinSettings.ext.settingItems.get("themePrecedence")
      expect(themePrecedence?.label).toBe("テーマの優先度")
      expect(themePrecedence?.options).toStrictEqual({ high: "高", normal: "標準" })

      // Theme names are proper nouns and stay untranslated
      expect(fakeJoplinSettings.ext.settingItems.get("theme")?.options).toHaveProperty(
        "vscodeDark",
        "VSCode Dark",
      )
    })

    it("falls back to English when the Joplin locale is unavailable", async () => {
      const fakeJoplinSettings = await startPlugin(undefined)

      expect(fakeJoplinSettings.ext.settingSections.get("EditorThemesI18n")?.label).toBe(
        "Editor Themes",
      )
    })
  })
})
