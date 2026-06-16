# Integrations (Python)

> **🚧 Upcoming — not yet shipped.** Design proposals for first-party framework
> adapters. See [Python overview](README.md) for status.

Every adapter here ships as a separate optional install
(`pip install 'imprint-pdf[django]'`, etc.) and is a thin layer over the core
`pdf()` / `pdf_async()` API. You can always drop the adapter and stream raw
bytes yourself — adapters exist for ergonomics, not capability.

---

## Django

```bash
pip install 'imprint-pdf[django]'
```

```python
# settings.py — 🚧 Upcoming
INSTALLED_APPS = [..., "imprint.django"]
IMPRINT = {
    "CONFIG": "imprint.toml",            # or a dict
    "ASSET_RESOLVER": "filesystem",      # filesystem | s3 | gcs | custom
    "PROFILE": "default",                # default | pdf-ua-1 | pdf-x-4
}
```

### Function views

```python
# views.py — 🚧 Upcoming
from imprint.django import PdfResponse, StreamingPdfResponse
from .templates.invoice import InvoicePdf      # .impy file
from .models import Invoice as InvoiceModel

def invoice_pdf(request, invoice_id):
    invoice = InvoiceModel.objects.select_related("customer").get(pk=invoice_id)
    return PdfResponse(
        InvoicePdf(invoice=invoice),
        filename=f"invoice-{invoice.id}.pdf",
    )

def quarterly_report(request, year, quarter):
    qs = Sale.objects.filter(year=year, quarter=quarter).iterator()
    return StreamingPdfResponse(Report(sales=qs), filename=f"Q{quarter}-{year}.pdf")
```

`PdfResponse` buffers the bytes; `StreamingPdfResponse` writes pages as they are
laid out — usable for multi-thousand-page reports without holding the whole
document in memory.

### CBV mixin

```python
# 🚧 Upcoming
from django.views.generic import DetailView
from imprint.django import PdfResponseMixin

class InvoiceView(PdfResponseMixin, DetailView):
    model = InvoiceModel
    pdf_template = "invoices.templates.invoice:InvoicePdf"
    pdf_filename = "invoice-{object.id}.pdf"
```

`pdf_template` is a dotted path to a Python callable, not a template file.

### Model → PDF helpers

```python
# 🚧 Upcoming
from imprint.django import as_pdf

class InvoiceModel(models.Model):
    ...
    pdf = as_pdf("invoices.templates.invoice:InvoicePdf", filename="invoice-{instance.id}.pdf")

# usage
bytes_ = invoice.pdf()                          # → bytes
invoice.pdf.save_to("/tmp/x.pdf")               # → Path
invoice.pdf.attach_to(email_message)            # → adds MIME attachment
```

### Email attachments

```python
# 🚧 Upcoming
from django.core.mail import EmailMessage
from imprint.django import pdf_attachment

msg = EmailMessage("Your invoice", body, from_, [to])
msg.attach(pdf_attachment(InvoicePdf(invoice=invoice), filename="invoice.pdf"))
msg.send()
```

### Admin

```python
# 🚧 Upcoming
from imprint.django.admin import PdfAdminMixin

@admin.register(InvoiceModel)
class InvoiceAdmin(PdfAdminMixin, admin.ModelAdmin):
    pdf_actions = {"Download invoice": "invoices.templates.invoice:InvoicePdf"}
```

Adds a "Download invoice" row action that renders and serves the PDF inline.

---

## FastAPI

```bash
pip install 'imprint-pdf[fastapi]'
```

```python
# main.py — 🚧 Upcoming
from fastapi import FastAPI, Depends
from imprint.fastapi import PdfResponse, StreamingPdfResponse
from .templates.invoice import InvoicePdf      # .impy file
from . import db

app = FastAPI()

@app.get("/invoice/{invoice_id}")
async def invoice(invoice_id: str):
    data = await db.get_invoice(invoice_id)
    return PdfResponse(InvoicePdf(invoice=data), filename=f"invoice-{invoice_id}.pdf")

@app.get("/report/{year}/{quarter}")
async def report(year: int, quarter: int):
    return StreamingPdfResponse(
        Report(sales=db.stream_sales(year, quarter)),
        filename=f"Q{quarter}-{year}.pdf",
    )
```

`PdfResponse` is a normal Starlette `Response` subclass, so dependency
injection, middleware, and OpenAPI generation work unchanged. (`Content-Type`,
`Content-Disposition`, and `Content-Length` are set automatically.)

### Background generation + signed URLs

```python
# 🚧 Upcoming
from fastapi import BackgroundTasks
from imprint.fastapi import render_to_storage

@app.post("/invoice/{invoice_id}/email")
async def email_invoice(invoice_id: str, bg: BackgroundTasks):
    data = await db.get_invoice(invoice_id)
    bg.add_task(render_to_storage, InvoicePdf(invoice=data), key=f"invoices/{invoice_id}.pdf")
    return {"status": "queued"}
```

---

## Flask

```bash
pip install 'imprint-pdf[flask]'
```

```python
# app.py — 🚧 Upcoming
from flask import Flask
from imprint.flask import send_pdf
from .templates.invoice import InvoicePdf      # .impy file

app = Flask(__name__)

@app.get("/invoice/<invoice_id>")
def invoice(invoice_id):
    data = db.get_invoice(invoice_id)
    return send_pdf(InvoicePdf(invoice=data), filename=f"invoice-{invoice_id}.pdf")
```

For streaming responses, `send_pdf(..., stream=True)` switches to
`werkzeug.wrappers.Response` with a chunked body.

---

## Litestar

```bash
pip install 'imprint-pdf[litestar]'
```

```python
# app.py — 🚧 Upcoming
from litestar import Litestar, get
from imprint.litestar import PdfResponse
from .templates.invoice import InvoicePdf      # .impy file

@get("/invoice/{invoice_id:str}")
async def invoice(invoice_id: str) -> PdfResponse:
    data = await db.get_invoice(invoice_id)
    return PdfResponse(InvoicePdf(invoice=data), filename=f"invoice-{invoice_id}.pdf")

app = Litestar(route_handlers=[invoice])
```

---

## Airflow

```bash
pip install 'imprint-pdf[airflow]'
```

```python
# dags/render_invoices.py — 🚧 Upcoming
from airflow.decorators import dag, task
from imprint.airflow import RenderPdfOperator
from datetime import datetime

@dag(start_date=datetime(2026, 1, 1), schedule="@daily", catchup=False)
def render_invoices():
    @task
    def fetch_invoice_ids():
        return list(db.get_pending_invoice_ids())

    RenderPdfOperator.partial(
        task_id="render",
        template="invoices.templates.invoice:InvoicePdf",
        output="s3://invoices/{{ task_instance.xcom_pull(task_ids='get_invoice', key='id') }}.pdf",
    ).expand(template_kwargs=fetch_invoice_ids().map(lambda i: {"invoice": db.get_invoice(i)}))

render_invoices()
```

`RenderPdfOperator` understands XComs, dynamic mapping, and the standard Airflow
templating system. The operator does not spawn a subprocess — rendering happens
in-process on the worker.

---

## Celery

```bash
pip install 'imprint-pdf[celery]'
```

```python
# tasks.py — 🚧 Upcoming
from celery import shared_task
from imprint import pdf
from imprint.celery import pdf_task
from .templates.invoice import InvoicePdf      # .impy file

# Plain task — call pdf() directly
@shared_task
def render_invoice(invoice_id: str) -> bytes:
    return pdf(InvoicePdf(invoice=db.get_invoice(invoice_id)))

# Convenience — auto-uploads to configured storage
@pdf_task(output="s3://invoices/{invoice_id}.pdf")
def render_invoice_to_s3(invoice_id: str):
    return InvoicePdf(invoice=db.get_invoice(invoice_id))
```

Worker pool considerations: each worker holds **one** WASM instance per process.
Use `--pool=prefork --concurrency=N` to scale; the WASM heap stays warm across
tasks within a worker. Cold start cost is paid once per worker boot (~100 ms).

---

## Jupyter

```bash
pip install 'imprint-pdf[jupyter]'
```

```python
# 🚧 Upcoming
from imprint import Document, Page, H1, P
from imprint.jupyter import display_pdf

doc = Document(Page(H1("Hello"), P("World"), size="A4", class_="p-12"))
display_pdf(doc)        # → renders an inline PDF preview iframe
```

`display_pdf` returns an `IPython.display.HTML` whose iframe streams the PDF
inline. Auto-updates when the cell re-runs.

---

## AWS Lambda / GCP Cloud Functions / Azure Functions

No adapter required — the wheel is self-contained and ships ARM64 + x86_64. Cold
start budget on Lambda ARM64 with `imprint-pdf[print]` installed is ≈250 ms (vs.
≈4–8 s for a headless Chromium layer).

```python
# handler.py — 🚧 Upcoming
import json
from imprint import pdf
from base64 import b64encode
from templates.invoice import InvoicePdf

def lambda_handler(event, context):
    data = json.loads(event["body"])
    bytes_ = pdf(InvoicePdf(invoice=data))
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/pdf"},
        "body": b64encode(bytes_).decode(),
        "isBase64Encoded": True,
    }
```

For tighter cold start, ship the WASM core in a Lambda layer and the template
code in the function package. Fonts go in the layer too.

---

## Choosing an adapter

| You want…                          | Use                                   |
| ---------------------------------- | ------------------------------------- |
| HTTP response in Django            | `imprint.django.PdfResponse`          |
| HTTP response in FastAPI/Starlette | `imprint.fastapi.PdfResponse`         |
| Long report, low memory            | `StreamingPdfResponse` (any adapter)  |
| Scheduled batch                    | Airflow `RenderPdfOperator`           |
| Queued background render           | Celery `@pdf_task`                    |
| Notebook preview                   | `imprint.jupyter.display_pdf`         |
| Raw bytes, no framework            | `imprint.pdf(...)` / `pdf_async(...)` |

## See also

- [Quick start](quick-start.md)
- [Authoring](authoring.md)
- [Architecture](architecture.md)
- [Streaming PDFs](../cookbook/streaming.md) — shared with the JS adapter
- [Batch generation](../cookbook/batch-generation.md) — shared with the JS
  adapter
