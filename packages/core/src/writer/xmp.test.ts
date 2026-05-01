import { describe, expect, it } from 'vitest';
import { buildXmpPacket } from './xmp.js';

describe('buildXmpPacket', () => {
  it('emits the standard XMP wrapper and namespaces', () => {
    const xmp = buildXmpPacket({
      createDate: new Date('2026-01-01T00:00:00Z'),
      modifyDate: new Date('2026-01-01T00:00:00Z'),
      documentId: '00000000-0000-4000-8000-000000000001',
      instanceId: '00000000-0000-4000-8000-000000000002',
    });

    expect(xmp).toContain('<?xpacket begin=');
    expect(xmp).toContain('<?xpacket end="w"?>');
    expect(xmp).toContain('xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"');
    expect(xmp).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    expect(xmp).toContain('xmlns:xmp="http://ns.adobe.com/xap/1.0/"');
    expect(xmp).toContain('xmlns:pdf="http://ns.adobe.com/pdf/1.3/"');
    expect(xmp).toContain('<xmp:CreatorTool>imprint</xmp:CreatorTool>');
    expect(xmp).toContain('<pdf:Producer>imprint</pdf:Producer>');
    expect(xmp).toContain('<xmpMM:DocumentID>uuid:00000000-0000-4000-8000-000000000001');
    expect(xmp).toContain('<xmpMM:InstanceID>uuid:00000000-0000-4000-8000-000000000002');
  });

  it('encodes title as a dc:title alt-language record', () => {
    const xmp = buildXmpPacket({ title: 'Q1 Report', lang: 'en-US' });
    expect(xmp).toContain(
      '<dc:title><rdf:Alt><rdf:li xml:lang="en-US">Q1 Report</rdf:li></rdf:Alt></dc:title>',
    );
    expect(xmp).toContain('<dc:language><rdf:Bag><rdf:li>en-US</rdf:li></rdf:Bag></dc:language>');
  });

  it('encodes author as dc:creator (an rdf:Seq, ordered)', () => {
    const xmp = buildXmpPacket({ author: 'Acme Inc.' });
    expect(xmp).toContain('<dc:creator><rdf:Seq><rdf:li>Acme Inc.</rdf:li></rdf:Seq></dc:creator>');
  });

  it('encodes keywords as dc:subject (rdf:Bag) and pdf:Keywords (string)', () => {
    const xmp = buildXmpPacket({ keywords: ['invoice', 'fy2026'] });
    expect(xmp).toContain(
      '<dc:subject><rdf:Bag><rdf:li>invoice</rdf:li><rdf:li>fy2026</rdf:li></rdf:Bag></dc:subject>',
    );
    expect(xmp).toContain('<pdf:Keywords>invoice, fy2026</pdf:Keywords>');
  });

  it('escapes XML metacharacters in user-provided strings', () => {
    const xmp = buildXmpPacket({
      title: 'A & B <test>',
      author: 'O\'Reilly "&" Co.',
      keywords: ['<bad>', 'a&b'],
    });
    expect(xmp).toContain('A &amp; B &lt;test&gt;');
    expect(xmp).toContain('O&apos;Reilly &quot;&amp;&quot; Co.');
    expect(xmp).toContain('<rdf:li>&lt;bad&gt;</rdf:li>');
    expect(xmp).toContain('<rdf:li>a&amp;b</rdf:li>');
  });

  it('emits a 2 KB whitespace pad (XMP spec convention) before the closing wrapper', () => {
    const xmp = buildXmpPacket({ title: 'x' });
    const padMatch = xmp.match(/ {2048}/);
    expect(padMatch).not.toBeNull();
  });

  it('omits dc:* fields when no metadata is provided', () => {
    const xmp = buildXmpPacket({});
    expect(xmp).not.toContain('<dc:title');
    expect(xmp).not.toContain('<dc:creator');
    expect(xmp).not.toContain('<dc:description');
    expect(xmp).not.toContain('<dc:subject');
    // CreatorTool/Producer/CreateDate/ModifyDate are always emitted because
    // PDF/A requires them.
    expect(xmp).toContain('<xmp:CreatorTool>');
    expect(xmp).toContain('<pdf:Producer>');
  });

  it('uses ISO-8601 UTC dates without millisecond precision', () => {
    const xmp = buildXmpPacket({
      createDate: new Date('2026-04-30T12:34:56.789Z'),
      modifyDate: new Date('2026-04-30T12:34:57.000Z'),
    });
    expect(xmp).toContain('<xmp:CreateDate>2026-04-30T12:34:56Z</xmp:CreateDate>');
    expect(xmp).toContain('<xmp:ModifyDate>2026-04-30T12:34:57Z</xmp:ModifyDate>');
  });
});
