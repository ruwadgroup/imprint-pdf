# Changelog

## 1.0.0

### Minor Changes

- [`cbc9e72`](https://github.com/tamimbinhakim/imprint-pdf/commit/cbc9e72d4c3c946d5effda5855b89a329cb727f1)
  Thanks [@tamimbinhakim](https://github.com/tamimbinhakim)! - Introduce the
  three optional add-on packages as part of the v1.0-beta milestone.

  **@imprint-pdf/print** — `printIntent()` post-process hook for PDF/X-4,
  PDF/X-4p, PDF/A-2b, and PDF/A-3 output. Includes ICC output intent embedding,
  CMYK colour helpers (`rgbToCmyk`, `cmykOperator`), spot colour spaces
  (`embedSpotColorSpace`, `embedOverprintState`), bleed/trim/registration marks
  (`applyPageBoxes`, `drawPrintMarks`), and factur-X / ZUGFeRD attachment via
  `applyPdfA`.

  **@imprint-pdf/sign** — PKCS#7 detached signatures with the standard ISO
  32000-2 `/ByteRange` mechanism (`signWithByteRange`) and an in-house trailer
  form (`signBuffer`). AES-256 V=5/R=6 document encryption with permission flags
  (`encryptDocument`). Certificate inspection (`parseCertificate`). Optional RFC
  3161 TSA timestamping.

  **@imprint-pdf/ua** — PDF/UA-1 structure tree via `taggedPdf()` post-process
  hook. Walks the reconciler IR to emit `StructElem` dictionaries, role map,
  `MarkInfo`, `ViewerPreferences`, `Lang`, and alt text from JSX props.
  Pre-render IR validator (`validateUA`) reports missing `lang`, `title`, and
  alt text.

  All three packages are licensed under Apache-2.0.

All notable changes are documented here. See
[Conventional Commits](https://www.conventionalcommits.org) and
[Changesets](../../.changeset) for the release workflow.
