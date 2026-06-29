import { describe, expect, it } from 'vitest';
import { Document } from './components/Document.js';
import { Page } from './components/Page.js';
import { pdf } from './pdf.js';

// A precompiled classMap (produced at build time by `@imprint-pdf/vite`'s
// `imprint()` plugin from the project's Tailwind theme) must be honored by
// `pdf()` directly - no `projectRoot`, no runtime Tailwind compilation. This is
// what lets the browser render with the real project theme. Guards the
// config-loader merge that previously dropped `classMap`.
describe('precompiled tailwind classMap', () => {
  it('pdf() renders using options.tailwind.classMap and skips runtime Tailwind', async () => {
    const classMap = {
      'text-brand': { color: 'oklch(0.55 0.2 270)' },
      'p-4': { paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 },
    };
    const bytes = await pdf(
      <Document title="brand">
        <Page size="A4" className="p-4">
          <span className="text-brand">Branded</span>
        </Page>
      </Document>,
      // No projectRoot: if the classMap weren't honored this would throw trying
      // to load tailwindcss from cwd.
      { as: 'bytes', tailwind: { classMap } },
    );
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect(bytes.byteLength).toBeGreaterThan(1024);
  });
});
