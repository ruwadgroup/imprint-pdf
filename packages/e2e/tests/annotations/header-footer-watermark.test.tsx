import { Document, Footer, Header, Page, Watermark } from '@imprint/react';
import { describe, expect, it } from 'vitest';
import { extractText, inspect, render } from '../../src/helpers/index.js';

describe('document-level chrome', () => {
  it('header and footer are stamped on every page', async () => {
    const pdf = await render(
      <Document>
        <Header>
          <span>top of page</span>
        </Header>
        <Footer>
          <span>bottom of page</span>
        </Footer>
        <Page size="A4" style={{ padding: 24 }}>
          <span>page 1 body</span>
        </Page>
        <Page size="A4" style={{ padding: 24 }}>
          <span>page 2 body</span>
        </Page>
      </Document>,
    );
    const pages = await extractText(pdf);
    for (const items of pages) {
      const flat = items.map((i) => i.text).join('|');
      expect(flat).toContain('top of page');
      expect(flat).toContain('bottom of page');
    }
  });

  it('watermark renders behind page content on every page', async () => {
    const pdf = await render(
      <Document>
        <Watermark>
          <span style={{ fontSize: 60, color: '#e2e8f0' }}>DRAFT</span>
        </Watermark>
        <Page size="A4" style={{ padding: 24 }}>
          <span>page 1</span>
        </Page>
        <Page size="A4" style={{ padding: 24 }}>
          <span>page 2</span>
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.pageCount).toBe(2);
    const pages = await extractText(pdf);
    for (const items of pages) {
      const flat = items.map((i) => i.text).join('|');
      expect(flat).toContain('DRAFT');
    }
  });
});
