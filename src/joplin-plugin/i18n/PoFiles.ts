import { I18n } from "@joplin-plugin/i18n/I18n"

import de from "@locales/de.po?raw"
import es from "@locales/es.po?raw"
import fr from "@locales/fr.po?raw"
import it from "@locales/it.po?raw"
import jaJp from "@locales/ja_JP.po?raw"
import ko from "@locales/ko.po?raw"
import ptBr from "@locales/pt_BR.po?raw"
import ru from "@locales/ru.po?raw"
import zhCn from "@locales/zh_CN.po?raw"
import zhTw from "@locales/zh_TW.po?raw"

/**
 * PO files bundled into the plugin at build time, keyed by Joplin locale code.
 *
 * The files are embedded as strings (rather than read at runtime) so that translation
 * also works on mobile, where plugins have no file system access.
 */
export const PoFiles: I18n.PoFiles = {
  "de": de,
  "es": es,
  "fr": fr,
  "it": it,
  "ja_JP": jaJp,
  "ko": ko,
  "pt_BR": ptBr,
  "ru": ru,
  "zh_CN": zhCn,
  "zh_TW": zhTw,
}
