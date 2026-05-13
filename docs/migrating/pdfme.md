# Migrating from pdfme

`pdfme` is template-driven — absolute-positioned JSON schemas, not flowable
React components. The migration is a conceptual shift, not just a package swap.

## Key differences

| pdfme                            | imprint-pdf                                   |
| -------------------------------- | --------------------------------------------- |
| JSON template + data merge       | React components + TypeScript props           |
| Absolute-positioned schemas      | Flowable CSS layout (Flex + Grid + Block)     |
| WYSIWYG designer (GUI)           | Code-first with `imprint dev` preview         |
| No Tailwind                      | Real Tailwind v4                              |
| No complex-script shaping        | HarfBuzz (Arabic, CJK, Devanagari, …)         |
| Label/form/certificate use cases | All use cases + reports, contracts, brochures |

## When to stay on pdfme

pdfme's WYSIWYG designer and absolute-positioning model are genuinely better for
data-fill templates — labels, simple forms, certificates — where designers (not
engineers) own the layout. If that's the workflow, stay.

Migrate to imprint-pdf when:

- You need real layout (columns, tables, grid)
- You want Tailwind class-based styling
- You need multi-page reports with auto-pagination
- You need edge runtime support
- You need HarfBuzz-quality typography

## Conceptual migration

### pdfme schema

```json
{
  "schemas": [
    [
      {
        "type": "text",
        "name": "name",
        "position": { "x": 50, "y": 80 },
        "width": 150,
        "height": 10
      },
      {
        "type": "text",
        "name": "amount",
        "position": { "x": 150, "y": 120 },
        "width": 50,
        "height": 10
      }
    ]
  ]
}
```

### imprint-pdf equivalent

```tsx
export function Invoice({ name, amount }: { name: string; amount: number }) {
  return (
    <Document>
      <Page size="A4" className="p-12 font-sans">
        <p className="text-base font-medium">{name}</p>
        <p className="mt-8 text-lg font-bold">${amount.toLocaleString()}</p>
      </Page>
    </Document>
  );
}
```

## Package swap

```bash
pnpm remove pdfme
pnpm add @imprint-pdf/react @imprint-pdf/core tailwindcss
pnpm add -D @imprint-pdf/cli
```
