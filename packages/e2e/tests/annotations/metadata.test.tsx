import { Document, Page } from '@imprint/react';
import { describe, expect, it } from 'vitest';
import { inspect, render } from '../../src/helpers/index.js';

describe('document metadata', () => {
  it('emits an XMP metadata stream when metadata is provided', async () => {
    const pdf = await render(
      <Document
        title="Q1 Report"
        author="Acme Inc."
        subject="Quarterly summary"
        keywords={['report', 'fy2026']}
        lang="en-US"
      >
        <Page size="A4" style={{ padding: 24 }}>
          <span>cover</span>
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.hasMetadata).toBe(true);
    expect(meta.metadataXmp).toBeDefined();

    const xmp = meta.metadataXmp!;
    expect(xmp).toContain('<?xpacket begin=');
    expect(xmp).toContain('<dc:title>');
    expect(xmp).toContain('Q1 Report');
    expect(xmp).toContain('Acme Inc.');
    expect(xmp).toContain('Quarterly summary');
    expect(xmp).toContain('<rdf:li>report</rdf:li>');
    expect(xmp).toContain('<rdf:li>fy2026</rdf:li>');
    expect(xmp).toContain('<dc:language>');
    expect(xmp).toContain('<xmp:CreatorTool>imprint');
    expect(xmp).toContain('<pdf:Producer>imprint');
    expect(xmp).toContain('<xmpMM:DocumentID>uuid:');
    expect(xmp).toContain('<xmpMM:InstanceID>uuid:');
  });

  it('omits the XMP stream when no metadata is set', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <span>plain</span>
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.hasMetadata).toBe(false);
  });
});
