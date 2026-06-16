# Python adapter

> **🚧 Upcoming — not yet shipped.** This document describes the planned
> `imprint-pdf` Python adapter. The API is a design proposal; signatures may
> change before the first release. Track progress in
> [ROADMAP.md](../../ROADMAP.md#vox--python-adapter-upcoming).

Real Tailwind. Real typography. PDF from Python — no Chromium, no headless
browser, no subprocess shells. Same engine as the JavaScript adapter, same
PdfNode IR, same output bytes.

## Why a Python adapter

imprint-pdf is an isomorphic toolchain organized around a single immutable
intermediate representation (the `PdfNode` IR). That IR is what the React
reconciler emits, what the layout pass consumes, and what the writer turns into
PDF bytes. **A "Python adapter" is just a second front end that emits the same
IR** — the layout, shaping, Tailwind compilation, and writing pipeline are
identical.

Concretely, that means Python users get the same guarantees JavaScript users
get:

- Real Tailwind v4 (Oxide compiler), not a translated subset
- HarfBuzz shaping with full GSUB/GPOS, complex scripts, variable fonts
- Knuth–Plass paragraph breaking + Plass-style page breaking
- PDF/UA-1 tagging, PDF/X-4 CMYK output, PKCS#7 signing (via add-ons)
- Sub-100 ms cold start on serverless runtimes
- One Apache-2.0 license across the stack

The Python adapter is **not** a shell wrapper around the Node CLI. It runs the
imprint-pdf WASM core in-process (via [Wasmtime](https://wasmtime.dev/) or
[Wasmer](https://wasmer.io/)) and ships as a manylinux / macOS / Windows wheel
with no Node runtime required.

## Packages

| Package                | Purpose                                 | Status      |
| ---------------------- | --------------------------------------- | ----------- |
| `imprint-pdf`          | Core authoring API, components, `pdf()` | 🚧 Upcoming |
| `imprint-pdf-tailwind` | Tailwind v4 Oxide bindings              | 🚧 Upcoming |
| `imprint-pdf-print`    | PDF/X-4, CMYK, ICC profiles             | 🚧 Upcoming |
| `imprint-pdf-ua`       | PDF/UA-1 tagged PDF, structure tree     | 🚧 Upcoming |
| `imprint-pdf-sign`     | PKCS#7 detached signatures              | 🚧 Upcoming |
| `imprint-pdf-django`   | Django integration (views, mixins, ORM) | 🚧 Upcoming |
| `imprint-pdf-fastapi`  | FastAPI response class, dependency      | 🚧 Upcoming |
| `imprint-pdf[all]`     | Convenience meta-package                | 🚧 Upcoming |

## Install

```bash
pip install imprint-pdf
# or
uv add imprint-pdf
# or
poetry add imprint-pdf
```

Optional extras follow the JavaScript layering:

```bash
pip install 'imprint-pdf[tailwind]'            # real Tailwind v4 Oxide
pip install 'imprint-pdf[print]'               # CMYK, PDF/X-4
pip install 'imprint-pdf[ua,sign]'             # tagged PDFs + signatures
pip install 'imprint-pdf[django]'              # Django adapter
pip install 'imprint-pdf[fastapi]'             # FastAPI adapter
pip install 'imprint-pdf[all]'                 # everything
```

## Requirements

| Requirement   | Version                              | Notes                          |
| ------------- | ------------------------------------ | ------------------------------ |
| Python        | 3.11+                                | Same minimum for `.impy` files |
| Platform      | Linux glibc 2.28+, macOS 12+, Win 10 | manylinux2_28 wheels           |
| Architectures | x86_64, aarch64 (arm64)              | Universal wheel on macOS       |
| Wasm runtime  | bundled                              | Wasmtime via `wasmtime-py`     |
| Node.js       | **not required**                     | No subprocess, no Node         |

## At a glance

The canonical authoring format is `.impy` — a dedicated file extension that
relates to `.py` the way `.tsx` relates to `.ts`. It's a Python module with
first-class JSX inside `@template` functions, compiled to a Python AST at import
time and cached in `__pycache__/`.

```python
# templates/invoice.impy — 🚧 Upcoming
from dataclasses import dataclass
from imprint import template

@dataclass
class Invoice:
    id: str
    customer: str
    total: float

@template
def InvoicePdf(*, invoice: Invoice):
    <Document>
        <Page size="A4" class="p-12 font-sans bg-white text-gray-900">
            <div class="flex justify-between items-start">
                <h1 class="text-2xl font-bold tracking-tight">Invoice</h1>
                <span class="text-sm text-gray-500">#{invoice.id}</span>
            </div>
            <div class="mt-8">
                <p class="text-sm font-medium text-gray-500">Bill to</p>
                <p class="mt-1 text-base">{invoice.customer}</p>
            </div>
            <div class="mt-12 flex justify-between border-t pt-4">
                <span class="text-sm font-medium">Total</span>
                <span class="text-lg font-bold">${invoice.total:,.2f}</span>
            </div>
        </Page>
    </Document>
```

Render from any normal `.py` file:

```python
# main.py
from imprint import pdf
from .templates.invoice import InvoicePdf, Invoice

bytes_ = pdf(InvoicePdf(invoice=Invoice(id="INV-001", customer="Acme Corp", total=4200)))
open("invoice.pdf", "wb").write(bytes_)
```

Don't want a new file format? Components are also exposed as **plain Python
callables** — `Div("hi", class_="p-4")` — that produce the same PdfNode IR. Both
surfaces coexist; pick per file.

See [authoring](authoring.md) for the full design and the `.impy`-vs-callables
trade-offs.

## Editor support

A single install gets you everything:

```bash
pip install 'imprint-pdf[dev]'
```

Bundles `imprint-lsp` (the language server) and the install metadata each editor
needs. First-party plugins:

| Editor    | Plugin                       | Status      |
| --------- | ---------------------------- | ----------- |
| VS Code   | `imprint-pdf.imprint-vscode` | 🚧 Upcoming |
| Cursor    | (uses the VS Code extension) | 🚧 Upcoming |
| Zed       | `imprint-pdf/imprint-zed`    | 🚧 Upcoming |
| JetBrains | `imprint-pdf-pycharm`        | 🚧 Upcoming |
| Neovim    | `nvim-lspconfig` snippet     | 🚧 Upcoming |
| Helix     | `languages.toml` snippet     | 🚧 Upcoming |

Features in every editor:

- Syntax highlighting for `.impy` markup blocks
- Tailwind class autocomplete in `class="..."`
- Component prop autocomplete and validation
- Jump-to-definition across `.py` ↔ `.impy`
- Inline type errors on unknown elements or prop mismatches
- Format-on-save (Black for Python blocks, markup formatter for JSX)

## Where to go next

- **[Quick start](quick-start.md)** — your first PDF from Python in five minutes
- **[Authoring](authoring.md)** — `.impy` files vs callable API, props,
  composition, children
- **[Integrations](integrations.md)** — Django, FastAPI, Flask, Litestar,
  Airflow, Celery, Jupyter
- **[Architecture](architecture.md)** — how the Python adapter compiles to the
  PdfNode IR and runs the WASM core in-process
- **[Roadmap milestone](../../ROADMAP.md#vox--python-adapter-upcoming)** — what
  ships in which order

## Out of scope

The Python adapter intentionally does **not**:

- Run a headless browser, even as a fallback.
- Spawn a Node.js subprocess. The wheel is self-contained.
- Re-implement Tailwind. The real Oxide compiler runs via WASM bindings.
- Re-implement layout or shaping. Same Taffy + HarfBuzz binaries the JS adapter
  uses.
- Re-implement the PDF writer. Same `pdf-lib` (v0) / Rust writer (v1) the JS
  adapter uses.

If you need server-side rendering of React components from Python, that's
**not** what this adapter is for — write your templates in Python directly. The
IR is the contract, not the front-end framework.
