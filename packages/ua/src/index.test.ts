import { describe, expect, it } from 'vitest';
import type { UADocumentProps } from './index.js';

describe('@imprint/ua types', () => {
  it('UADocumentProps accepts valid lang', () => {
    const props: UADocumentProps = { lang: 'en', displayDocTitle: true };
    expect(props.lang).toBe('en');
  });
});
