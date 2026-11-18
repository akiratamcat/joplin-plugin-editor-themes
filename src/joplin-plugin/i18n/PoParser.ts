/**
 * Minimal parser for gettext PO files.
 *
 * Supports the subset of the PO format needed for UI translation:
 * - `msgid` / `msgstr` pairs (including multi-line strings)
 * - `msgctxt` (combined with `msgid` as `context\u0004msgid`, like gettext)
 * - comments (`#`, `#.`, `#:`, `#,`, `#|`)
 * - C-style escape sequences (`\n`, `\t`, `\"`, `\\`)
 *
 * Entries marked `fuzzy`, entries with an empty `msgstr`, and the header entry (empty `msgid`)
 * are skipped so that the caller falls back to the untranslated `msgid`.
 */
export namespace PoParser {
  export type Catalog = ReadonlyMap<string, string>

  type Field = "msgctxt" | "msgid" | "msgstr"

  interface Entry {
    msgctxt?: string
    msgid?: string
    msgstr?: string
    fuzzy: boolean
  }

  const contextSeparator = "\u0004"

  /**
   * Parses the PO file {@link content} into a catalog that maps `msgid` to `msgstr`.
   */
  export function parse(content: string): Catalog {
    const catalog = new Map<string, string>()

    let entry: Entry = { fuzzy: false }
    let lastField: Field | undefined

    const flush = (): void => {
      const { msgctxt, msgid, msgstr, fuzzy } = entry
      if (msgid !== undefined && msgid !== "" && msgstr !== undefined && msgstr !== "" && !fuzzy) {
        catalog.set(msgctxt === undefined ? msgid : `${msgctxt}${contextSeparator}${msgid}`, msgstr)
      }
      entry = { fuzzy: false }
      lastField = undefined
    }

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()

      if (line === "") {
        flush()
        continue
      }

      if (line.startsWith("#")) {
        // A comment after a complete entry starts the next entry
        if (entry.msgstr !== undefined) flush()
        if (line.startsWith("#,") && line.includes("fuzzy")) entry.fuzzy = true
        continue
      }

      const keyword = /^(msgctxt|msgid|msgstr)\s+(".*")$/.exec(line)
      if (keyword !== null) {
        const field = keyword[1] as Field
        // A new msgctxt / msgid after a complete entry starts the next entry
        if (field !== "msgstr" && entry.msgstr !== undefined) flush()
        entry[field] = unquote(keyword[2])
        lastField = field
        continue
      }

      if (line.startsWith('"') && lastField !== undefined) {
        entry[lastField] = (entry[lastField] ?? "") + unquote(line)
      }
      // Other keywords (e.g. msgid_plural, msgstr[n]) are not supported and are ignored
    }

    flush()
    return catalog
  }

  function unquote(quoted: string): string {
    return quoted
      .slice(1, -1)
      .replace(/\\(.)/g, (_match, char: string) => {
        switch (char) {
          case "n": {
            return "\n"
          }
          case "t": {
            return "\t"
          }
          case "r": {
            return "\r"
          }
          default: {
            return char
          }
        }
      })
  }
}
