import JoplinContentScripts from "api/JoplinContentScripts"
import JoplinPlugins from "api/JoplinPlugins"
import JoplinSettings, { ChangeHandler } from "api/JoplinSettings"
import { ContentScriptType, ExtendedSettingSection } from "api/types"

import { JoplinSettings as JoplinSettingsExt } from "@ext/joplin/JoplinSettings"

import { CmExtensionClient } from "@cm-extension-ipc/CmExtensionClient"
import { PluginRequestHandler } from "@joplin-plugin-ipc/model/handler"

import { RequestHandler } from "@joplin-plugin/handler/RequestHandler"
import { I18n, Translate } from "@joplin-plugin/i18n/I18n"

export interface JoplinPluginProps<Settings> {
  readonly cmExtensionClient: CmExtensionClient
  readonly contentScript: {
    readonly id: string
    readonly path: string
  }
  readonly joplin: {
    readonly contentScripts: JoplinContentScripts
    readonly plugins: JoplinPlugins
    readonly settings: JoplinSettings
  }
  readonly requestHandler: RequestHandler
  /**
   * Creates the setting section with UI strings localized by the given {@link Translate} function.
   */
  readonly createSettingSection: (_: Translate) => ExtendedSettingSection<Settings>
  /**
   * PO files used to localize the UI, keyed by Joplin locale code.
   */
  readonly poFiles: I18n.PoFiles
}

/**
 * EditorThemes Joplin plugin.
 *
 * - Localizes the UI with {@link poFiles} according to the Joplin `locale` setting.
 * - Registers the setting section from {@link createSettingSection} in {@link joplin#settings}.
 * - Registers Code Mirror {@link contentScript} in {@link joplin#contentScripts}.
 * - Registers Joplin plugin {@link requestHandler} to handle messages from {@link contentScript}.
 * - Registers {@link cmExtensionClient} as change listener for Joplin plugin settings.
 */
export namespace JoplinPlugin {
  export const pluginName = "EditorThemesI18n"

  export async function register<Settings>({
    cmExtensionClient,
    contentScript,
    joplin,
    requestHandler,
    createSettingSection,
    poFiles,
  }: JoplinPluginProps<Settings>): Promise<void> {
    return await joplin.plugins.register({
      onStart: async () => {
        // Joplin requires a restart after changing the language, so reading it once is sufficient
        const locale = (await joplin.settings.globalValue("locale")) as string | undefined
        const translate = I18n.create(locale, poFiles)

        await JoplinSettingsExt.register(
          joplin.settings,
          pluginName,
          createSettingSection(translate),
        )
        await joplin.contentScripts.register(
          ContentScriptType.CodeMirrorPlugin,
          contentScript.id,
          contentScript.path,
        )
        await joplin.contentScripts.onMessage(contentScript.id, messageHandler(requestHandler))
        await joplin.settings.onChange(settingsChangeHandler(cmExtensionClient))
      },
    })
  }
}

function messageHandler(requestHandler: RequestHandler): PluginRequestHandler {
  return (request) => requestHandler.handle(request)
}

function settingsChangeHandler(cmExtensionClient: CmExtensionClient): ChangeHandler {
  // Perform a no-op since CM extension is completely re-initialized when settings change
  return () => void (async () => await cmExtensionClient.ping())()
}
