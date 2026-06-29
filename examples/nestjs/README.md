# example - nestjs

NestJS runtime adapter for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). Category **C**
(Node, bytes).

## What's shown

A single controller (`src/invoice.controller.ts`) with `@Get('invoice')` that
renders the shared `invoice` fixture to PDF bytes and streams them back through
Express's `@Res()` response:

```ts
res
  .type('application/pdf')
  .send(Buffer.from(await pdf(byId('invoice')!.render(), { as: 'bytes' })));
```

`src/app.module.ts` wires the controller; `src/main.ts` bootstraps the app.

## Run

```bash
pnpm --filter @imprint-pdf/example-nestjs dev
# → GET http://localhost:3000/invoice
```

## DX notes

- NestJS uses legacy (`experimentalDecorators`) decorators, so this adapter's
  `tsconfig.json` adds `experimentalDecorators` + `emitDecoratorMetadata` on top
  of the strict workspace base.
- `@Res()` opts out of Nest's response serializer - you own the headers and the
  raw `Buffer`, which is exactly what binary PDF delivery needs.
- The Express `Response` type comes from `@types/express` (devDep); the runtime
  comes transitively from `@nestjs/platform-express`.
