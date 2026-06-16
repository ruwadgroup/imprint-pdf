# Quick start (Python)

> **🚧 Upcoming — not yet shipped.** Pinned to the design proposal for the
> Python adapter. See [Python overview](README.md) for status.

Five minutes from `pip install` to a real PDF — no Chromium, no Node, no
subprocess.

## 1. Install

```bash
pip install imprint-pdf
# or: uv add imprint-pdf
# or: poetry add imprint-pdf
```

## 2. Initialise

```bash
imprint init
```

`imprint init` writes `imprint.toml`, a `templates/invoice.impy` starter, and —
if it detects Django, FastAPI, Flask, or Litestar — wires a starter route into
your project. Existing files are left alone.

```toml
# imprint.toml — 🚧 Upcoming
[fonts]
inter = "./fonts/Inter.woff2"

[tailwind]
stylesheet = "./styles/app.css"
preset = "imprint"

[output]
profile = "default"     # one of: default, pdf-ua-1, pdf-x-4
```

Write your Tailwind v4 stylesheet normally — the real Oxide compiler resolves
classes at build time, with a runtime WASM fallback for dynamic classnames.

```css
/* styles/app.css */
@import 'tailwindcss';
@import 'imprint-pdf/preset';

@theme {
  --font-sans: 'Inter', sans-serif;
}
```

## 3. Write a template

Templates live in `.impy` files — JSX/TSX for Python. They import like any other
Python module; the import hook installed by `import imprint` compiles them to a
Python AST on first import and caches the result in `__pycache__/`.

```bash
pip install 'imprint-pdf[dev]'      # bundles imprint-lsp + editor metadata
```

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

Highlights compared to plain Python:

- `class` is `class` — no `class_` workaround.
- `if` / `for` / `while` work directly inside markup.
- `{expression}` is Python; `${value:,.2f}` formatting is supported in both
  attributes and text content.
- Components are `@template` functions. They return a single root node — exactly
  like a React component.

> Don't want a new file extension? The callable API works in pure `.py` —
> `Div(H1("hi"), class_="p-4")`. Both produce identical PdfNode IR. See
> [authoring](authoring.md#2-callable-components-no-tooling-escape-hatch).

## 4. Render

### Plain script

```python
# generate.py — 🚧 Upcoming
from pathlib import Path
from imprint import pdf
from templates.invoice import InvoicePdf, Invoice, LineItem

invoice = Invoice(
    id="INV-001",
    customer="Acme Corp",
    total=4200.00,
    line_items=[
        LineItem(id="1", description="Consulting", quantity=10, unit_price=420.0),
    ],
)

Path("out/invoice.pdf").write_bytes(pdf(InvoicePdf(invoice=invoice)))
```

```bash
python generate.py
open out/invoice.pdf
```

### FastAPI

```python
# main.py — 🚧 Upcoming
from fastapi import FastAPI
from imprint.fastapi import PdfResponse
from templates.invoice import InvoicePdf
from . import db

app = FastAPI()

@app.get("/invoice/{invoice_id}")
async def invoice(invoice_id: str):
    data = await db.get_invoice(invoice_id)
    return PdfResponse(InvoicePdf(invoice=data), filename=f"invoice-{invoice_id}.pdf")
```

`PdfResponse` streams the PDF as it's written, so the first byte ships before
the last page has been laid out.

### Django

```python
# views.py — 🚧 Upcoming
from imprint.django import PdfResponse
from templates.invoice import InvoicePdf
from .models import Invoice as InvoiceModel

def invoice_pdf(request, invoice_id):
    data = InvoiceModel.objects.get(pk=invoice_id)
    return PdfResponse(InvoicePdf(invoice=data), filename=f"invoice-{invoice_id}.pdf")
```

### Async batch

```python
# 🚧 Upcoming
import asyncio
from imprint import pdf_async

async def render_batch(invoices):
    return await asyncio.gather(*[pdf_async(InvoicePdf(invoice=i)) for i in invoices])
```

`pdf_async` runs the WASM core off the main thread, so a batch of 200 invoices
finishes in roughly the time of the slowest single render plus the dispatch
overhead.

## 5. Preview locally

```bash
imprint dev templates/invoice.impy
# → http://localhost:4000
```

The dev server watches your Python source, the Tailwind stylesheet, and the
config. The same JSON-over-SSE protocol the JavaScript dev server uses powers
the inspector, so the [element inspector](../guides/components.md) works
identically.

## 6. Validate

With `imprint-pdf-ua` or `imprint-pdf-print` installed:

```bash
imprint validate ./out/invoice.pdf --profile pdf-ua-1
```

Non-zero on failure — wire into CI as a pytest step:

```python
# tests/test_invoice_pdf.py — 🚧 Upcoming
from imprint.testing import validate_pdf
from templates.invoice import InvoicePdf
from imprint import pdf

def test_invoice_is_pdf_ua_1(sample_invoice):
    report = validate_pdf(pdf(InvoicePdf(invoice=sample_invoice)), profile="pdf-ua-1")
    assert report.ok, report.failures
```

## Where to go next

- [Authoring](authoring.md) — components, props, children, conditionals,
  iteration, fragments
- [Integrations](integrations.md) — Django · FastAPI · Flask · Litestar ·
  Airflow · Celery · Jupyter
- [Architecture](architecture.md) — what the wheel ships, how the IR works, PyO3
  path for v1
- [Tailwind](../guides/tailwind.md) — what's supported, what isn't (identical to
  the JS adapter)
- [Typography](../guides/typography.md) — fonts, shaping, Knuth–Plass
