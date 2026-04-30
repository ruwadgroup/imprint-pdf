import { describe, expect, it } from 'vitest';
import type { PrintDocumentProps } from './index.js';

describe('@imprint/print types', () => {
  it('PrintDocumentProps accepts PDF/X-4 intent', () => {
    const props: PrintDocumentProps = { intent: 'PDF/X-4' };
    expect(props.intent).toBe('PDF/X-4');
  });
});
