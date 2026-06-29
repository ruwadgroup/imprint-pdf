import { createServer } from 'node:http';
import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { createSchema, createYoga } from 'graphql-yoga';

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        invoicePdf: String!
      }
    `,
    resolvers: {
      Query: {
        invoicePdf: async () => {
          const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
          return Buffer.from(bytes).toString('base64');
        },
      },
    },
  }),
});

const server = createServer(async (req, res) => {
  // Binary sibling: GraphQL ships base64, but a browser wants the file.
  if (req.url === '/invoice.pdf') {
    const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
    res.writeHead(200, { 'content-type': 'application/pdf' });
    res.end(Buffer.from(bytes));
    return;
  }
  yoga(req, res);
});

server.listen(3000, () => {
  console.log('GraphQL: http://localhost:3000/graphql');
  console.log('PDF:     http://localhost:3000/invoice.pdf');
});
