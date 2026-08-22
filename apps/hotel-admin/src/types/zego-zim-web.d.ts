/**
 * zego-zim-web ships hand-written .d.ts files under entity/, but doesn't
 * wire a "types" field in its package.json, so plain `import { ZIM } from
 * 'zego-zim-web'` resolves to nothing under `strict`. It's only ever passed
 * straight into ZegoUIKitPrebuilt.addPlugins({ ZIM }) — which itself types
 * that plugin as `any` — so an `any` shim here costs us no real type safety.
 */
declare module 'zego-zim-web' {
  export const ZIM: any
}
