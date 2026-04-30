import { describe, expect, it } from 'vitest';

describe('@imprint/next exports', () => {
  it('renderToServer is exported', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.renderToServer).toBe('function');
  });

  it('renderToEdge is exported', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.renderToEdge).toBe('function');
  });
});
