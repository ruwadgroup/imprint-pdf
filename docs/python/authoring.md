# Authoring (Python)

> **🚧 Upcoming — not yet shipped.** Design proposal. See
> [Python overview](README.md) for status.

imprint-pdf for Python is built around a single idea: **JSX is the right surface
syntax for documents, even in Python.** Markup belongs in markup, not in nested
function calls. We ship a dedicated file format — `.impy` — and the tooling to
make it feel native.

```
TypeScript       Python
─────────       ──────
.ts              .py
.tsx             .impy      ← imprint-pdf templates
```

If you've written TSX, `.impy` will feel familiar in five minutes. If you
haven't, it's just HTML with `{python_expressions}` and `if`/`for` control flow
that lives inside the markup.

---

## 1. `.impy` files (canonical)

A `.impy` file is a Python module with first-class JSX. It imports like any
other Python module — `from .templates.invoice import Invoice` — because
`import imprint` installs a `sys.meta_path` finder that compiles `.impy` to a
Python AST on first import and caches the result in `__pycache__/`.

```python
# templates/invoice.impy — 🚧 Upcoming
from dataclasses import dataclass
from imprint import template

@dataclass
class Invoice:
    id: str
    customer: str
    total: float
    line_items: list["LineItem"]

@dataclass
class LineItem:
    id: str
    description: str
    quantity: int
    unit_price: float

    @property
    def total(self) -> float:
        return self.quantity * self.unit_price

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

            <ul class="mt-12">
                for item in invoice.line_items:
                    <li key={item.id} class="grid grid-cols-12 gap-4 py-2 border-b">
                        <span class="col-span-7">{item.description}</span>
                        <span class="col-span-2 text-right">{item.quantity}×</span>
                        <span class="col-span-3 text-right">${item.total:,.2f}</span>
                    </li>
            </ul>

            <div class="mt-8 flex justify-between border-t-2 pt-4">
                <span class="text-sm font-medium">Total</span>
                <span class="text-lg font-bold">${invoice.total:,.2f}</span>
            </div>
        </Page>
    </Document>
```

Notes on what's different from Python:

- **No `return` before markup.** A `@template` function's body can contain JSX
  blocks directly; the compiler wraps them in the right return.
- **`if` / `for` / `while` inside markup.** These read top-to-bottom, just like
  Python. No special `{condition && <X/>}` tricks.
- **`{expression}` is Python.** Anything that evaluates to a node, a string, or
  an iterable of those becomes children. f-string-style format specs
  (`${item.total:,.2f}`) are supported in attribute values and text content.
- **`class` is `class`.** No `class_`. The compiler knows the difference between
  a JSX attribute and a Python keyword.
- **`<>...</>` fragments.** Same as JSX.
- **`{...props}` spreads.** Same as JSX.

### Components are just `@template` functions

```python
# templates/_components.impy — 🚧 Upcoming
from imprint import template, Node

@template
def Stack(*children: Node, gap: int = 4):
    <div class={f"flex flex-col gap-{gap}"}>{*children}</div>

@template
def Card(*, title: str, children: tuple[Node, ...]):
    <div class="rounded-lg border p-6">
        <h2 class="text-lg font-semibold">{title}</h2>
        <div class="mt-4">{*children}</div>
    </div>
```

Used the same way as imprint's built-in components:

```python
# templates/page.impy
from ._components import Stack, Card

@template
def Welcome():
    <Stack gap={6}>
        <Card title="One">Body one</Card>
        <Card title="Two">Body two</Card>
    </Stack>
```

### Type checking

`.impy` files are statically typed. The bundled language server emits a
synthetic `.pyi` for each compiled module so `mypy`, `pyright`, and `pylance`
see fully-typed components without any custom plugin.

```python
@template
def Invoice(*, invoice: Invoice):
    <Page size="Letter">           # ✅
    <Page size="A99">              # ❌ Page.size expects Literal['A4', 'A5', 'Letter', ...]
    <Page sizes="A4">              # ❌ Page has no attribute 'sizes'
    <div class={invoice.foo}>      # ❌ Invoice has no attribute 'foo'
```

### Editor support

A single install gets you everything:

```bash
pip install 'imprint-pdf[dev]'      # ships the LSP binary
```

| Editor    | Plugin                          | Status      |
| --------- | ------------------------------- | ----------- |
| VS Code   | `imprint-pdf.imprint-vscode`    | 🚧 Upcoming |
| Cursor    | (uses VS Code extension)        | 🚧 Upcoming |
| Zed       | `imprint-pdf/imprint-zed`       | 🚧 Upcoming |
| JetBrains | `imprint-pdf-pycharm` plugin    | 🚧 Upcoming |
| Neovim    | LSP config via `nvim-lspconfig` | 🚧 Upcoming |
| Helix     | `languages.toml` snippet        | 🚧 Upcoming |

Features in every editor:

- Syntax highlighting for markup blocks
- Tailwind class autocomplete inside `class="..."` (powered by the official
  Tailwind LSP)
- Component prop autocomplete and validation
- Jump to definition across `.py` ↔ `.impy`
- Inline error squiggles on prop mismatch or unknown elements
- Hover docs from your dataclass fields
- Format-on-save (Black + a markup formatter)

### How the compiler works

A `.impy` file is compiled to an equivalent `.py` AST at import time:

```
.impy source
    │
    ▼  (imprint.compiler — pure Python, no codegen at runtime)
Python AST (compile() → code object)
    │
    ▼  cached in __pycache__/<name>.impy.<hash>.pyc
loaded as a normal module
```

The transform is purely textual → AST → bytecode. There is no runtime parser, no
`exec`, no `eval`. Tracebacks point back to the original `.impy` line numbers
via the standard `linecache` mechanism — error messages name the file you wrote,
not the generated Python.

You can preview the transform any time:

```bash
imprint show templates/invoice.impy
# prints the generated Python
```

Useful for debugging, code review, and convincing skeptics that there is no
magic — just AST rewriting.

### Build pre-compile (production)

For zero-cost imports in production, pre-compile:

```bash
imprint build              # compiles every .impy in the project to .py
imprint build --watch      # watch mode for dev
```

Pre-compiled `.py` files commit cleanly to git if you prefer not to ship the
compiler at runtime — `.impy` becomes a build-time-only artifact, like `.tsx` in
a published JS package.

---

## 2. Callable components (no-tooling escape hatch)

Don't want a new file format, an LSP, or anything else? Components are also
plain Python callables, importable from `imprint`:

```python
# templates/invoice.py — 🚧 Upcoming
from imprint import Document, Page, Div, H1, P, Span, Ul, Li

def Invoice(*, invoice):
    return Document(
        Page(
            Div(
                H1("Invoice", class_="text-2xl font-bold"),
                Span(f"#{invoice.id}", class_="text-sm text-gray-500"),
                class_="flex justify-between",
            ),
            Ul(
                *(
                    Li(
                        Span(item.description, class_="col-span-7"),
                        Span(f"${item.total:,.2f}", class_="col-span-3 text-right"),
                        key=item.id,
                        class_="grid grid-cols-12 py-2",
                    )
                    for item in invoice.line_items
                ),
                class_="mt-12",
            ),
            size="A4",
            class_="p-12",
        )
    )
```

Trade-offs:

| Concern                | `.impy`                         | Callables                            |
| ---------------------- | ------------------------------- | ------------------------------------ |
| File format            | New (`.impy`)                   | Standard `.py`                       |
| Tooling required       | Yes (LSP + editor plugin)       | None                                 |
| Syntax highlighting    | JSX-aware                       | Python only                          |
| Markup readability     | High — looks like HTML          | Lower — nested function calls        |
| Reserved-word handling | `class`, `for` work natively    | `class_`, `for_` workarounds         |
| Conditionals / loops   | Native Python `if`/`for` inline | Generator expressions and ternaries  |
| Type checking          | Full, via generated `.pyi`      | Full, via overloads on each callable |
| Output                 | **Identical PdfNode IR**        | **Identical PdfNode IR**             |

**Recommendation:** use `.impy` for templates, callables for one-off helpers
inside `.py` modules that don't merit their own template file. Both compile to
the same PdfNode tree, so you can mix freely:

```python
# main.py
from imprint import Div
from .templates.invoice import InvoicePdf, InvoiceData

# Build a small wrapper in plain Python around a .impy template
def page_for(invoice):
    return Div(InvoicePdf(invoice=invoice), class_="break-after-page")
```

---

## 3. Mental model

Whichever surface you use, the mental model is **React functional components,
minus hooks, minus state, minus effects**:

- Components are pure functions of their props.
- A PDF is a snapshot. Nothing re-renders. No effects to run.
- Data fetching happens before rendering —
  `pdf(InvoicePdf(invoice=await db.get(id)))`.
- Children are always positional. There is no implicit `children` prop unless
  you declare one.

If you've used JSX in React, Vue SFC, Solid, or Astro, `.impy` will read
unsurprising. If you've used [htpy](https://htpy.dev) or
[FastHTML](https://fastht.ml), the callable form will.

---

## 4. Why `.impy` and not...?

| Alternative                       | Why we didn't pick it                                                                                                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plain callables only              | The DX winner: HTML-shaped problems deserve HTML-shaped syntax. Callable APIs win on grep-ability and lose everywhere else (markup readability, syntax highlighting, formatting, copy-paste from a designer's mockup).                       |
| PEP 750 t-strings (`jsx(t"...")`) | Python 3.14+ only; markup is a string, so no syntax highlighting unless every editor learns a custom embedded-language hint; no static analysis without a custom mypy plugin; interpolation is fine but control flow inside markup is awful. |
| Source-rewriting decorator (Pyxl) | Import hooks rewriting strings inside `.py` files break every linter, formatter, and type checker until each one is patched. Pyxl pioneered this and died for exactly this reason. A dedicated extension scopes the problem.                 |
| Jinja-style template files        | Untyped, no component model, no IDE autocomplete on data, runtime errors instead of static. Great for HTML emails, wrong for typed document pipelines.                                                                                       |
| HTMX-style server-rendered HTML   | Not authoring a document tree; describes interactions. Different problem.                                                                                                                                                                    |
| `htpy` context managers           | Beautiful for short snippets, awkward for pages-deep nesting. Indent levels collide with Python's own indentation rules, making refactors fragile.                                                                                           |

The cost of `.impy` is an LSP and an editor extension. That's a one-time build,
and it's been done before (Vue SFCs, Astro, Svelte all ship LSPs as their
primary DX investment). Worth it.

---

## See also

- [Quick start](quick-start.md)
- [Integrations](integrations.md)
- [Architecture](architecture.md) — how `.impy` compiles to the IR
- [Components reference](../reference/components.md) — the canonical component
  list (shared with the JS adapter)
