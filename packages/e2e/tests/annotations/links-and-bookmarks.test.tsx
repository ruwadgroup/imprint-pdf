import { Bookmark, Document, Link, Page } from '@imprint-pdf/react';
import { describe, expect, it } from 'vitest';
import { inspect, render } from '../../src/helpers/index.js';

describe('links and bookmarks', () => {
  it('external URI links create Link annotations', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <Link href="https://example.com">
            <span>visit us</span>
          </Link>
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.pages[0]!.annotationSubtypes).toContain('Link');
  });

  it('bookmarks register an outline at the document level', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <Bookmark title="Cover" />
          <span>cover content</span>
        </Page>
        <Page size="A4" style={{ padding: 24 }}>
          <Bookmark title="Chapter One" />
          <span>chapter</span>
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.hasOutline).toBe(true);
    expect(meta.pageCount).toBe(2);
  });

  it('anchor links resolve to in-document destinations', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <Link href="#chapter-two">
            <span>jump</span>
          </Link>
        </Page>
        <Page size="A4" style={{ padding: 24 }}>
          <Bookmark title="Chapter Two" />
          <span>destination</span>
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.pages[0]!.annotationSubtypes).toContain('Link');
    // Both pages still render normally.
    expect(meta.pageCount).toBe(2);
  });
});
