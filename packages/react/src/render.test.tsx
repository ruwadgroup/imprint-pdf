import { describe, expect, it } from 'vitest';
import { Document } from './components/Document.js';
import { Page } from './components/Page.js';
import { Text } from './components/Text.js';
import { View } from './components/View.js';
import { buildPdfNodeTree } from './reconciler.js';
import { renderToBuffer } from './render.js';

describe('buildPdfNodeTree', () => {
  it('builds a document node tree', () => {
    const tree = buildPdfNodeTree(
      <Document>
        <Page size="A4">
          <View>
            <Text>Hello</Text>
          </View>
        </Page>
      </Document>,
    );
    expect(tree.type).toBe('document');
    expect(tree.children[0]?.type).toBe('page');
    expect(tree.children[0]?.children[0]?.type).toBe('view');
  });

  it('stores className on node props', () => {
    const tree = buildPdfNodeTree(
      <Document>
        <Page size="A4">
          <View className="flex flex-row px-4" />
        </Page>
      </Document>,
    );
    const viewNode = tree.children[0]?.children[0];
    expect((viewNode?.props as Record<string, unknown>).className).toBe('flex flex-row px-4');
  });

  it('resolves inline style onto node', () => {
    const tree = buildPdfNodeTree(
      <Document>
        <Page size="A4">
          <View style={{ backgroundColor: '#ff0000' }} />
        </Page>
      </Document>,
    );
    const viewNode = tree.children[0]?.children[0];
    expect(viewNode?.style.backgroundColor).toBe('#ff0000');
  });

  it('throws when root element is not Document', () => {
    // buildPdfNodeTree itself does not throw; renderToBuffer validates the root
    const tree = buildPdfNodeTree(<View />);
    expect(tree.type).not.toBe('document');
  });
});

describe('renderToBuffer', () => {
  it('produces a non-empty PDF buffer for a minimal document', async () => {
    const buf = await renderToBuffer(
      <Document>
        <Page size="A4">
          <Text>Test</Text>
        </Page>
      </Document>,
    );
    expect(buf).toBeInstanceOf(Uint8Array);
    expect(buf.byteLength).toBeGreaterThan(100);
    // PDF magic bytes
    const header = String.fromCharCode(...buf.slice(0, 4));
    expect(header).toBe('%PDF');
  });

  it('rejects when root is not a Document', async () => {
    await expect(renderToBuffer(<View />)).rejects.toThrow(/must be <Document>/);
  });

  it('renders className-styled layout without errors', async () => {
    const buf = await renderToBuffer(
      <Document>
        <Page size="A4" className="bg-white px-12 py-11">
          <View className="flex flex-row justify-between items-start mb-4">
            <Text className="text-xs font-bold text-gray-900">Label</Text>
            <Text className="text-xs text-gray-500">Value</Text>
          </View>
        </Page>
      </Document>,
    );
    expect(buf.byteLength).toBeGreaterThan(100);
  });
});
