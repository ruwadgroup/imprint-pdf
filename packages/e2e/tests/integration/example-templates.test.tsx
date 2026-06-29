/**
 * End-to-end integration test: render every document in the shared
 * `@imprint-pdf/fixtures` corpus through the full pipeline and assert structural
 * invariants (page count, extractable text). This is the test that catches
 * regressions affecting any real-world document.
 *
 * Rendered via `pdf()` (the entry every adapter uses) so Tailwind classes are
 * resolved through the runtime fallback, exactly as in production.
 */

import { documents } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { describe, expect, it } from 'vitest';
import { extractText, inspect } from '../../src/helpers/index.js';

const renderBytes = (id: string) =>
  pdf(documents.find((d) => d.id === id)!.render(), { as: 'bytes' });

describe('fixture corpus renders end-to-end', () => {
  it.each(documents.map((d) => [d.id, d] as const))('renders %s', async (id) => {
    const bytes = await renderBytes(id);
    const meta = await inspect(bytes);
    expect(meta.pageCount).toBeGreaterThanOrEqual(1);

    const [first] = await extractText(bytes);
    const text = (first ?? []).map((i) => i.text).join('');
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it('renders an invoice that reads as an invoice', async () => {
    const [first] = await extractText(await renderBytes('invoice'));
    const flat = (first ?? [])
      .map((i) => i.text)
      .join('|')
      .toLowerCase();
    expect(flat).toContain('invoice');
  });

  it('renders the full contract including its final signature block', async () => {
    const [...pages] = await extractText(await renderBytes('contract'));
    const all = pages
      .flat()
      .map((i) => i.text)
      .join(' ')
      .toLowerCase();
    expect(all).toContain('receiving party');
  });
});
