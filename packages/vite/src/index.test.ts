import { describe, expect, it } from 'vitest';
import { imprint } from './index.js';

describe('imprint vite plugin', () => {
  it('returns an array of plugins', () => {
    const plugins = imprint({});
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });

  it('all plugins have a name', () => {
    const plugins = imprint({});
    for (const plugin of plugins) {
      expect(typeof plugin.name).toBe('string');
      expect(plugin.name.length).toBeGreaterThan(0);
    }
  });

  it('includes imprint-fonts plugin', () => {
    const plugins = imprint({ fonts: [{ family: 'Inter', src: './Inter.ttf' }] });
    const names = plugins.map((p) => p.name);
    expect(names).toContain('imprint-fonts');
  });

  it('includes imprint-hmr plugin', () => {
    const plugins = imprint({});
    const names = plugins.map((p) => p.name);
    expect(names).toContain('imprint-hmr');
  });

  it('imprint-fonts-list loads font metadata', () => {
    const plugins = imprint({ fonts: [{ family: 'Roboto', src: './Roboto.ttf', weight: 400 }] });
    const fontsList = plugins.find((p) => p.name === 'imprint-fonts-list')!;
    expect(fontsList).toBeDefined();
    const result = (fontsList as { load?: (id: string) => string | null }).load?.(
      '\0virtual:imprint-fonts',
    );
    expect(result).toContain('Roboto');
  });

  it('imprint-fonts-list returns null for unknown ids', () => {
    const plugins = imprint({});
    const fontsList = plugins.find((p) => p.name === 'imprint-fonts-list')!;
    const result = (fontsList as { load?: (id: string) => string | null }).load?.('other-module');
    expect(result).toBeNull();
  });
});
