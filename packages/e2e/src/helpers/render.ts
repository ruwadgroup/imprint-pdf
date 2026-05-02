import type { RenderOptions } from '@imprint-pdf/core';
import { renderToBuffer } from '@imprint-pdf/react';
import type { ReactElement } from 'react';

export type RenderArgs = RenderOptions & { tailwindRoot?: string };

/**
 * Tests use inline styles by default; Tailwind is opt-in via tailwindRoot to
 * keep assertions decoupled from class-resolution state.
 */
export async function render(el: ReactElement, args: RenderArgs = {}): Promise<Uint8Array> {
  const { tailwindRoot, ...rest } = args;
  const opts: RenderOptions = { ...rest };
  if (tailwindRoot) {
    opts.tailwind = { ...(rest.tailwind ?? {}), projectRoot: tailwindRoot };
  }
  return renderToBuffer(el, opts);
}
