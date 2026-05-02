import { describe, expect, it } from 'vitest';

describe('@imprint-pdf/cli exports', () => {
  it('exports all expected commands', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.runDev).toBe('function');
    expect(typeof mod.runInit).toBe('function');
    expect(typeof mod.runRender).toBe('function');
    expect(typeof mod.runValidate).toBe('function');
  });
});
