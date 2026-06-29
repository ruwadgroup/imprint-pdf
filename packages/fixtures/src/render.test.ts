import { pdf } from '@imprint-pdf/react';
import { describe, expect, it } from 'vitest';
import { documents } from './index.js';

// The node `pdf()` entry is imported HERE, in the test - never in the document
// components themselves (they stay runtime-agnostic). Rendering uses only the
// library's built-in standard fonts, so this is offline and deterministic.
describe('document corpus', () => {
  it('has unique, file-safe ids', () => {
    const ids = documents.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it.each(documents.map((d) => [d.id, d] as const))(
    'renders %s to a valid, non-trivial PDF',
    async (_id, doc) => {
      const bytes = await pdf(doc.render(), { as: 'bytes' });
      // PDF magic header.
      expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
      // Non-trivial output (a blank page is far smaller).
      expect(bytes.byteLength).toBeGreaterThan(1024);
    },
    30_000,
  );
});
