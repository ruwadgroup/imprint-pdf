# Migrating from pdfme

`pdfme` is a template-driven PDF generator. Its model is absolute-positioned
JSON schemas, not flowable React components. The migration is a conceptual
shift, not just a package swap.

## Key differences

| pdfme                            | Imprint                                       |
| -------------------------------- | --------------------------------------------- |
| JSON template + data merge       | React components + TypeScript props           |
| Absolute-positioned schemas      | Flowable CSS layout (Flex + Grid + Block)     |
| WYSIWYG designer (GUI)           | Code-first with `imprint dev` preview         |
| No Tailwind                      | Real Tailwind v4                              |
| No complex-script shaping        | HarfBuzz (Arabic, CJK, Devanagari, …)         |
| Label/form/certificate use cases | All use cases + reports, contracts, brochures |

## When to stay on pdfme

pdfme's WYSIWYG designer and absolute-positioning model are genuinely better for
data-fill templates like labels, simple forms, and certificates where designers
(not engineers) own the layout. If that's your workflow, pdfme is fine.

Migrate to Imprint when:

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

### Imprint equivalent

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
pnpm add @imprint/react @imprint/core
pnpm add -D @imprint/cli @imprint/tailwind tailwindcss
```
