# CLI reference

```bash
pnpm add -D @imprint-pdf/cli
npx imprint --help
```

## `imprint init`

Scaffold `imprint.config.ts` in the current directory.

```bash
npx imprint init
```

Options:

| Flag         | Description                    |
| ------------ | ------------------------------ |
| `--tailwind` | Pre-fill Tailwind config path. |
| `--fonts`    | Pre-fill font declarations.    |

## `imprint render`

Render a React component to a PDF.

```bash
imprint render <component> [options]
```

| Flag       | Default     | Description                                      |
| ---------- | ----------- | ------------------------------------------------ |
| `--out`    | `./out.pdf` | Output file path.                                |
| `--props`  | `{}`        | JSON-encoded props passed to the default export. |
| `--config` | auto-detect | Path to `imprint.config.ts`.                     |
| `--watch`  | off         | Rebuild on file save.                            |
| `--open`   | off         | Open PDF in the system viewer after render.      |
| `--strict` | off         | Error on unsupported CSS properties.             |

```bash
imprint render ./src/templates/Invoice.tsx \
  --out ./dist/invoice.pdf \
  --props '{"id":"INV-001","customer":"Acme Corp","total":4200}'
```

## `imprint dev`

Live preview server with hot-reload and element inspector.

```bash
imprint dev <component> [options]
```

| Flag       | Default     | Description                  |
| ---------- | ----------- | ---------------------------- |
| `--port`   | `4000`      | Local server port.           |
| `--config` | auto-detect | Path to `imprint.config.ts`. |
| `--open`   | `true`      | Open browser on start.       |

```bash
imprint dev src/templates/Invoice.tsx --port 4000
# → http://localhost:4000
```

HMR — edit the template, preview updates without a full reload. Same Vite plugin
integration as your app build.

## `imprint validate`

Validate a PDF against a conformance profile via veraPDF.

Requires `@imprint-pdf/print` or `@imprint-pdf/ua` and Java 11+ on `PATH`.

```bash
imprint validate <pdf> --profile <profile>
```

| Flag        | Required | Description                                              |
| ----------- | :------: | -------------------------------------------------------- |
| `--profile` |    ✓     | `pdf-ua-1`, `pdf-ua-2`, `pdf-x-4`, `pdf-a-2b`, `pdf-a-3` |
| `--report`  |          | Write a JSON report to this path.                        |
| `--verbose` |          | Print per-rule pass/fail details.                        |

```bash
imprint validate ./dist/report.pdf --profile pdf-ua-1 --report ./dist/report.pdf.json
```

Exit codes: `0` = pass, `1` = conformance failure, `2` = tool error.

## `imprint check`

Validate the `imprint.config.ts` schema and check that every referenced font
file exists.

```bash
imprint check
```

Exits non-zero on any config error. Safe in a pre-commit hook.
