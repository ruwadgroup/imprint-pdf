---
'@imprint-pdf/core': patch
---

Fix `RangeError: Index out of range` when loading fonts via Node's
`fs.readFile`.

`readFile` returns a Buffer that is typically a view into Node's allocation pool
— `buf.buffer` is the whole pool, frequently many KB larger than the file. The
asset resolver wrapped this in a `Uint8Array` view that preserved
`byteOffset`/`byteLength` correctly, but `createHbFont` passed `.buffer`
straight to HarfBuzz. HarfBuzz parses the entire ArrayBuffer it's handed, walked
past the font's end into pool padding, and threw
`RangeError: Index out of range`, which uncaughtException'd the render.

Two defensive fixes:

- `createAssetResolver().resolve(filePath)` now copies the file's bytes into a
  fresh, tight `Uint8Array`. Downstream WASM consumers can trust
  `bytes.buffer.byteLength === bytes.byteLength`.
- `createHbFont(bytes)` detects non-tight views and copies to a fresh
  `ArrayBuffer` before handing it to HarfBuzz. Defends against third-party
  `AssetResolver` implementations that return pool-backed bytes.

Symptom in the wild: registering any locally-resolved `.woff2` / `.ttf` font in
`imprint.config.ts` from a Node runtime (`renderToServer`, `renderToBuffer`,
Next.js route handlers) would hang the render and surface an
`uncaughtException`. Hosted URLs were unaffected because
`Response.arrayBuffer()` already returns a tight buffer.
