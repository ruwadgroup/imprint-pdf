# example - aws-lambda

AWS Lambda handler (API Gateway HTTP API / proxy integration) that renders the
`invoice` fixture to PDF using the standalone WASM build of imprint-pdf.

## What's shown

The Category D glue: API Gateway proxy responses are JSON envelopes, not raw
streams, so binary bodies travel as base64. Render to bytes with
`pdf(..., { as: 'bytes' })`, base64-encode, and set `isBase64Encoded: true` so
the gateway decodes it back to `application/pdf` on the way out.

```ts
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyHandlerV2 = async () => {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/pdf' },
    isBase64Encoded: true,
    body: Buffer.from(bytes).toString('base64'),
  };
};
```

## Run

Lambda has no first-class local dev server. Deploy `src/handler.ts` behind an
API Gateway HTTP API (proxy integration), or invoke the exported `handler`
directly from a test harness. Typecheck locally with:

```bash
pnpm --filter @imprint-pdf/example-aws-lambda typecheck
```

For the gateway to return binary, configure `*/*` (or `application/pdf`) as a
binary media type so it honours `isBase64Encoded`.

## DX notes

- **Category:** D (serverless, standalone WASM, base64 envelope out)
- **Entry:** `standalone` -
  `import { pdf } from '@imprint-pdf/react/standalone'`
- **Glue:** 3 lines (`pdf(..., { as: 'bytes' })`, base64-encode, set
  `isBase64Encoded`)
- **Rating:** 🟡 - no `Response` shortcut here: the proxy envelope forces a
  manual bytes → base64 hop and a gateway-side binary-media-type setting.
  `pdf()` itself is one call; the friction is API Gateway's, not the library's.
