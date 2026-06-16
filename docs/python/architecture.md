# Architecture (Python adapter)

> **🚧 Upcoming — not yet shipped.** Design proposal. See
> [Python overview](README.md) for status and
> [project ARCHITECTURE.md](../../ARCHITECTURE.md) for the full pipeline the
> Python adapter plugs into.

## TL;DR

```
┌──────────────────────────────────────────────────────────────────────┐
│ Authoring surface                                                    │
│   templates/invoice.impy        OR        templates/invoice.py       │
│   (JSX, @template functions)              (Div(...) callable form)   │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼  (imprint.compiler — text → Python AST)
                              │   .impy only; callables skip this stage
                              │
┌──────────────────────────────────────────────────────────────────────┐
│ Python AST → bytecode (cached in __pycache__/<name>.impy.<hash>.pyc) │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼  (pure Python tree construction at call time)
┌──────────────────────────────────────────────────────────────────────┐
│ PdfNode IR (Python dataclasses; same shape as the JS IR)             │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼  (serialized once at the WASM boundary)
┌──────────────────────────────────────────────────────────────────────┐
│ imprint-pdf core (WASM, embedded in the wheel via wasmtime-py)       │
│  ├─ Taffy layout                                                     │
│  ├─ HarfBuzz shaping + ICU4X segmentation                            │
│  ├─ Knuth–Plass + Plass page break                                   │
│  ├─ Tailwind v4 Oxide (if [tailwind] extra installed)                │
│  └─ pdf-lib v0 writer / Rust writer v1                               │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                         PDF bytes
```

The Python adapter is **a front end and a binding**, nothing else. It doesn't
re-implement layout, shaping, Tailwind, or the writer. Those run in the same
WASM modules the JS adapter uses, so a given input produces byte-identical
output from both languages.

## The `.impy` compiler

`.impy` is the canonical authoring format. An `.impy` file is a Python module
with JSX blocks inside `@template`-decorated functions. The compiler is a
**single-pass, pure-Python, text → AST transform**:

1. Tokenize the source. The lexer is a thin layer over Python's standard
   tokenizer — outside `<...>` blocks it produces standard Python tokens;
   inside, it emits markup tokens (`<`, tag-name, attribute=value, `{expr}`,
   `</tag>`).
2. Parse markup blocks into a JSX AST. Python statements pass through
   unmodified.
3. Lower the JSX AST to standard Python AST nodes — `<div class="p-4">x</div>`
   becomes `Div("x", class_="p-4")` at the AST level. Children inside `for` /
   `if` blocks become list comprehensions and conditional expressions.
4. Hand the resulting Python AST to `compile()` to produce bytecode.
5. Cache the bytecode in `__pycache__/<name>.impy.<hash>.pyc`.

There is **no runtime parser, no `eval`, no `exec`**. The compiled module is
indistinguishable from one a developer hand-wrote, which means CPython's
optimizer, JIT (3.13+), and profilers all work normally. Tracebacks point to the
original `.impy` line via `linecache` integration.

Compile timing on a 200-line `.impy` file (M1 Pro): ≈3 ms cold, ≈0 ms warm
(loaded from `.pyc`).

The compiler is also exposed as a CLI for offline use:

```bash
imprint show templates/invoice.impy            # print generated Python
imprint build                                  # compile to .py, no runtime hook
imprint build --watch                          # live recompile
```

`imprint build` is the production path: ship pre-compiled `.py` files so
deployed images don't need `imprint[dev]` and don't pay any (already small)
compile cost.

## The IR contract

The PdfNode IR is the public boundary between front ends (React reconciler,
`.impy` compiler, callable API, anything else) and the engine. Each PdfNode is
an immutable record with:

```python
# imprint/ir.py — 🚧 Upcoming
from dataclasses import dataclass
from typing import Any, Literal

@dataclass(frozen=True, slots=True)
class PdfNode:
    type: str                    # 'document', 'page', 'div', 'h1', 'Image', ...
    props: dict[str, Any]        # className → resolved CSS, etc.
    children: tuple["PdfNode | str", ...]
    key: str | None = None
    source: SourceSpan | None = None   # for error messages and inspector
```

The Python form is structurally identical to the JS form — same `type` strings,
same prop names (after the `class_` → `class` rewrite), same children semantics.
It serializes to the same JSON the JS adapter ships across the WASM boundary.

**Stability:** the IR will be marked stable in the same release that ships the
Python adapter — until then it is an internal contract between the JS front end
and the engine. See [STABILITY.md](../../STABILITY.md) for the guarantee.

## Why two syntaxes, one IR

Every authoring syntax compiles to a `PdfNode` tree before the engine sees
anything. That means:

- Adding a new front end (CLI YAML templates, a Jinja-flavoured renderer,
  whatever) is bounded work — implement a tree builder, you're done.
- The dev-server inspector, golden-file diff, snapshot testing, validation, and
  benchmarking all work identically for every front end, because they operate on
  the IR.
- A bug in the layout pass shows the same symptoms from Python and JS, which
  means one set of fixtures regresses both adapters.

```
.impy template               Callable (escape hatch)         React reconciler
──────────────               ───────────────────────          ─────────────────
<div class="p">x</div>       Div("x", class_="p")             <div className="p">…
        │                            │                              │
        ▼ (compiler)                 │                              │
        └────────────┬───────────────┴──────────────────┬───────────┘
                     ▼                                  ▼
                                 PdfNode IR
                                     │
                                     ▼
                                 layout → write → bytes
```

## Runtime

The wheel ships:

| Artifact              | Purpose                                     | Size (approx, gzipped) |
| --------------------- | ------------------------------------------- | ---------------------- |
| `imprint/_core.wasm`  | Taffy + HarfBuzz + ICU4X + writer           | ~1.8 MB                |
| `imprint/_oxide.wasm` | Tailwind v4 Oxide (opt-in via `[tailwind]`) | ~1.2 MB                |
| `imprint/*.py`        | Python authoring API, IR, parser, adapters  | ~80 KB                 |

WASM execution uses
[wasmtime-py](https://github.com/bytecodealliance/wasmtime-py). The engine is
instantiated **once per process**, not per render — cold start is ≈100 ms (Linux
x86_64, ARM64 similar), warm renders are <25 ms for a 1-page A4 invoice.

Threading model: the WASM instance is single-threaded, but rendering releases
the GIL across the WASM boundary, so `asyncio.gather` and process pools both
scale linearly. `pdf_async()` runs the WASM call on a dedicated thread inside
the runtime so it never blocks the event loop.

## Memory and ownership

- **No subprocess.** Renders happen in the calling Python process.
- **No font copies.** Fonts loaded by `imprint.toml` or `Font(...)` are mmapped
  once into the WASM linear memory and reused across renders.
- **One IR, one allocation.** The Python tree is serialized once (a single
  zero-copy `bytes` buffer over a stable Cap'n-Proto-ish wire format), handed to
  WASM, and dropped on the Python side.
- **Streaming output.** The writer yields page-sized chunks; the Python side
  consumes them lazily so multi-thousand-page reports do not balloon the heap.

## Implementation phases

### Phase 1 — Callable runtime + v0 WASM stack

- Python callables (`Div`, `H1`, …) emitting `PdfNode` IR
- WASM core invoked via `wasmtime-py`
- `pdf()`, `pdf_async()`, `imprint init`, `imprint render`, `imprint validate`
- Wheels: manylinux_2_28 (x86_64, aarch64), macOS 12+ universal, Win 10+
- This is the floor: ship usable Python before any tooling lands

### Phase 2 — `.impy` compiler

- Lexer, JSX parser, Python AST lowerer
- `sys.meta_path` finder + `__pycache__/` integration
- `imprint show` and `imprint build`
- Source-map / `linecache` integration so tracebacks point at `.impy` lines
- Black formatter plugin for embedded Python

### Phase 3 — Language server + editor plugins

- `imprint-lsp` (LSP over stdio, Rust + Salsa for incremental analysis)
- Generated `.pyi` stubs per `.impy` module so mypy / pyright Just Work
- First-party plugins for VS Code, Cursor, Zed, JetBrains, Neovim, Helix
- Tailwind LSP integration for class autocomplete
- `imprint dev` watches `.impy` + Tailwind CSS + Python sources, hot-reloads the
  preview server

### Phase 4 — Framework adapters

- `imprint-pdf-django`, `imprint-pdf-fastapi`, `imprint-pdf-flask`,
  `imprint-pdf-litestar`
- `imprint-pdf-celery`, `imprint-pdf-airflow`, `imprint-pdf-jupyter`

### Phase 5 — PyO3 bindings on v1 Rust writer

When the Rust writer lands
([ARCHITECTURE.md Phase v1](../../ARCHITECTURE.md#6-pdf-writing)), the Python
adapter swaps the writer behind the same public API:

- WASM → native compiled extension via PyO3
- Same Python API; users do not change code
- ~30–40% lower latency on large multi-page documents
- Smaller wheel (no WASM runtime needed for the writer; shaping still WASM until
  ICU4X / HarfBuzz ship as native CDylibs)

## Comparison: Python PDF generators in 2026

| Library              | Engine                      | Tailwind     | Knuth–Plass | CMYK / PDF/X | PDF/UA-1 | Cold start (Lambda ARM) |
| -------------------- | --------------------------- | ------------ | ----------- | ------------ | -------- | ----------------------- |
| ReportLab            | native                      | no           | no          | partial      | no       | ~150 ms                 |
| WeasyPrint           | Cairo + Pango               | CSS only     | no          | no           | no       | ~600 ms                 |
| xhtml2pdf            | ReportLab + html5lib        | very partial | no          | no           | no       | ~250 ms                 |
| Playwright/pyppeteer | Chromium                    | yes          | no          | no           | no       | 4–8 s                   |
| **imprint-pdf**      | **WASM (Taffy + HarfBuzz)** | **full v4**  | **yes**     | **yes**      | **yes**  | **~250 ms**             |

## Trade-offs

| Decision                                                 | Alternative                       | Why                                                                                                                                             |
| -------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `.impy` file format as the canonical authoring surface   | Pure callables, t-strings, Jinja  | Markup deserves markup syntax. Vue SFC, Svelte, and Astro all decided this. The DX cost is an LSP — pay it once.                                |
| Callable API kept as a non-deprecated escape hatch       | `.impy` only                      | Some teams won't install an LSP. The IR is the contract, so both surfaces compose freely.                                                       |
| Text → Python AST at import, then standard `compile()`   | Source-rewriting decorator (Pyxl) | Pyxl's decorator approach broke every linter and formatter. A dedicated file extension scopes the problem and is normal for typed JSX dialects. |
| WASM via wasmtime-py, not a Node subprocess              | Subprocess `node` CLI             | No Node dep, no IPC, lower cold start, simpler deploys                                                                                          |
| `wasmtime-py` over `wasmer-python`                       | wasmer-python                     | Wasmtime has the most active maintenance and best WASI preview2 support in 2026                                                                 |
| One WASM instance per process, GIL released across calls | Per-request instances             | Amortizes the ~100 ms cold start across the worker's lifetime                                                                                   |
| Same IR as JS, not a Python-specific variant             | Python-specific IR                | Single source of truth for the engine; eliminates cross-language drift                                                                          |
| Rust LSP, not a Python one                               | Pure-Python LSP                   | Incremental analysis at editor latencies requires Salsa-style demand-driven computation; Rust is where that ecosystem lives.                    |

## Open questions

Deliberately unresolved — we'll decide them as Phase 1 lands:

- **PyO3 vs WASM for the writer post-v1.** WASM keeps the deploy story tidy (one
  wheel, no glibc concerns). PyO3 wins on latency. We may ship both behind a
  feature flag.
- **AsyncIO concurrency model.** Per-task WASM instance, or single instance with
  a semaphore? The latter is simpler; the former scales linearly with cores.
  Likely: single instance + semaphore by default, opt-in pool for CPU-bound
  batch workloads.
- **Pydantic integration.** Auto-derive component prop types from a pydantic
  model? Useful for forms; awkward for runtime-typed children.
- **Jinja → PdfNode adapter.** Parse a Jinja-like template syntax into the IR
  for teams already on Jinja, or punt and recommend the callable form?

## See also

- [docs/python/README.md](README.md)
- [docs/python/authoring.md](authoring.md)
- [docs/python/integrations.md](integrations.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — full pipeline
- [STABILITY.md](../../STABILITY.md) — semver and public-API contract
- [ROADMAP.md](../../ROADMAP.md) — milestone plan
