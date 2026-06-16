export interface ImprintTailwindOptions {
  config?: string;
  stylesheet?: string;
  runtimeFallback?: boolean;
  content?: string[];
  safelist?: string[];
}

export { parseCssToStyleMap } from './css-to-styles.js';
export { runTailwind } from './tw-runner.js';
