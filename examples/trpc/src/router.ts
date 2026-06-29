import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  invoice: t.procedure
    .input(z.object({ id: z.string().default('invoice') }))
    .query(async ({ input }) => {
      const bytes = await pdf(byId(input.id)!.render(), { as: 'bytes' });
      return { pdf: Buffer.from(bytes).toString('base64') };
    }),
});

export type AppRouter = typeof appRouter;
