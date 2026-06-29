import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react/standalone';
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
