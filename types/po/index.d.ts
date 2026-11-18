/**
 * PO files imported with the `?raw` query are bundled as plain strings
 * (webpack `asset/source`, Vite `?raw`).
 */
declare module "*.po?raw" {
  const content: string
  export default content
}
