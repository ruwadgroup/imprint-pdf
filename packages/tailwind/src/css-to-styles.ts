import type { ResolvedStyle } from '@imprint/core';

// Map from CSS property name to ResolvedStyle key
const PROP_MAP: Partial<Record<string, keyof ResolvedStyle>> = {
  display: 'display',
  'flex-direction': 'flexDirection',
  'flex-wrap': 'flexWrap',
  'justify-content': 'justifyContent',
  'align-items': 'alignItems',
  'align-content': 'alignContent',
  'align-self': 'alignSelf',
  flex: 'flex',
  'flex-grow': 'flexGrow',
  'flex-shrink': 'flexShrink',
  'flex-basis': 'flexBasis',
  gap: 'gap',
  'row-gap': 'rowGap',
  'column-gap': 'columnGap',
  'grid-template-columns': 'gridTemplateColumns',
  'grid-template-rows': 'gridTemplateRows',
  'grid-column': 'gridColumn',
  'grid-row': 'gridRow',
  width: 'width',
  height: 'height',
  'min-width': 'minWidth',
  'max-width': 'maxWidth',
  'min-height': 'minHeight',
  'max-height': 'maxHeight',
  padding: 'padding',
  'padding-top': 'paddingTop',
  'padding-right': 'paddingRight',
  'padding-bottom': 'paddingBottom',
  'padding-left': 'paddingLeft',
  'padding-inline': 'paddingLeft', // will also set paddingRight below
  'padding-block': 'paddingTop', // will also set paddingBottom below
  margin: 'margin',
  'margin-top': 'marginTop',
  'margin-right': 'marginRight',
  'margin-bottom': 'marginBottom',
  'margin-left': 'marginLeft',
  'border-width': 'borderWidth',
  'border-top-width': 'borderTopWidth',
  'border-right-width': 'borderRightWidth',
  'border-bottom-width': 'borderBottomWidth',
  'border-left-width': 'borderLeftWidth',
  'border-color': 'borderColor',
  'border-top-color': 'borderTopColor',
  'border-right-color': 'borderRightColor',
  'border-bottom-color': 'borderBottomColor',
  'border-left-color': 'borderLeftColor',
  'border-radius': 'borderRadius',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'font-style': 'fontStyle',
  'line-height': 'lineHeight',
  'letter-spacing': 'letterSpacing',
  'text-align': 'textAlign',
  'text-decoration-line': 'textDecoration',
  'text-decoration': 'textDecoration',
  'text-transform': 'textTransform',
  'white-space': 'whiteSpace',
  'text-overflow': 'textOverflow',
  'word-spacing': 'wordSpacing',
  '-webkit-line-clamp': 'lineClamp',
  'line-clamp': 'lineClamp',
  'text-indent': 'textIndent',
  color: 'color',
  opacity: 'opacity',
  'background-color': 'backgroundColor',
  position: 'position',
  top: 'top',
  left: 'left',
  right: 'right',
  bottom: 'bottom',
  'z-index': 'zIndex',
  overflow: 'overflow',
  'overflow-x': 'overflowX',
  'overflow-y': 'overflowY',
};

// Parse CSS variables from :root / :host selector blocks
function parseCssVars(css: string): Map<string, string> {
  const vars = new Map<string, string>();
  // Match :root, :host, *, html blocks
  const rootRe = /(?::root|:host|\*|html)\s*(?:,\s*(?::root|:host|\*|html)\s*)*\{([^}]*)\}/gs;
  let m = rootRe.exec(css);
  while (m !== null) {
    const block = m[1] ?? '';
    const varRe = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let v = varRe.exec(block);
    while (v !== null) {
      vars.set(v[1]!.trim(), v[2]!.trim());
      v = varRe.exec(block);
    }
    m = rootRe.exec(css);
  }
  return vars;
}

// Extract one var(...) call from `str` starting at `start`, respecting nested parens.
// Returns { match, name, fallback, end } or null if not a var( at start.
function parseVarCall(
  str: string,
  start: number,
): { name: string; fallback: string | null; end: number } | null {
  if (!str.startsWith('var(', start)) return null;
  let depth = 1;
  let i = start + 4; // past 'var('
  const inner: string[] = [];
  while (i < str.length && depth > 0) {
    const ch = str[i]!;
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) break;
    }
    inner.push(ch);
    i++;
  }
  const content = inner.join('').trim();
  // Split on first comma that is not inside nested parens
  let commaIdx = -1;
  let d = 0;
  for (let j = 0; j < content.length; j++) {
    if (content[j] === '(') d++;
    else if (content[j] === ')') d--;
    else if (content[j] === ',' && d === 0) {
      commaIdx = j;
      break;
    }
  }
  const name = (commaIdx === -1 ? content : content.slice(0, commaIdx)).trim();
  const fallback = commaIdx === -1 ? null : content.slice(commaIdx + 1).trim();
  return { name, fallback, end: i + 1 };
}

// Resolve var(--name, fallback) recursively, up to 8 levels deep
function resolveVars(value: string, vars: Map<string, string>, depth = 0): string {
  if (depth > 8 || !value.includes('var(')) return value;
  let result = '';
  let i = 0;
  while (i < value.length) {
    const varStart = value.indexOf('var(', i);
    if (varStart === -1) {
      result += value.slice(i);
      break;
    }
    result += value.slice(i, varStart);
    const parsed = parseVarCall(value, varStart);
    if (!parsed) {
      result += value[i]!;
      i++;
      continue;
    }
    const { name, fallback, end } = parsed;
    const resolved = vars.get(name);
    if (resolved !== undefined) {
      result += resolveVars(resolved, vars, depth + 1);
    } else if (fallback !== null) {
      result += resolveVars(fallback, vars, depth + 1);
    } else {
      result += '0';
    }
    i = end;
  }
  return result;
}

// Evaluate simple calc() expressions: only handles + - * / with plain numbers and px/rem.
// Returns a dimensional value ('Npx') if the expression involves rem/px units,
// or a bare number string if it's a unitless ratio (e.g. line-height multipliers).
function resolveCalc(value: string): string {
  if (!value.includes('calc(')) return value;
  return value.replace(/calc\(([^)]+)\)/g, (_, expr: string) => {
    try {
      // Check if expression has rem/px units before stripping
      const hasDimension = /\d(?:\.\d+)?(?:rem|px|em|pt)/.test(expr);
      // Convert rem to plain numbers (px equivalent)
      const withPx = expr.replace(/(\d*\.?\d+)rem/g, (__, n: string) => `${parseFloat(n) * 16}`);
      // Strip px units for arithmetic
      const noUnits = withPx.replace(/(\d*\.?\d+)px/g, '$1');
      // Only evaluate if it's a simple arithmetic expression
      if (/^[\d\s+\-*/().]+$/.test(noUnits)) {
        // biome-ignore lint/security/noGlobalEval: safe — only digits and operators
        const result = eval(noUnits) as number;
        // Append px only for dimensional values; leave unitless ratios bare
        return hasDimension ? `${result}px` : `${result}`;
      }
    } catch {}
    return expr;
  });
}

// oklch(L% C H) → hex — approximate conversion via OKLab → linear sRGB → sRGB
function oklchToHex(l: number, c: number, h: number): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // OKLab → linear sRGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;

  let r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  let g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  let bv = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;

  // Gamma correction (linear → sRGB)
  const gamma = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };
  r = gamma(r);
  g = gamma(g);
  bv = gamma(bv);

  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bv)}`;
}

// Resolve oklch() function calls to hex
function resolveOklch(value: string): string {
  return value.replace(
    /oklch\(\s*(\d*\.?\d+)%\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s*\)/g,
    (_, ls: string, c: string, h: string) =>
      oklchToHex(parseFloat(ls) / 100, parseFloat(c), parseFloat(h)),
  );
}

function resolveValue(raw: string, vars: Map<string, string>): string {
  let v = resolveVars(raw, vars);
  v = resolveCalc(v);
  v = resolveOklch(v);
  // Convert remaining rem → px
  v = v.replace(/(\d*\.?\d+)rem/g, (_, n: string) => `${parseFloat(n) * 16}px`);
  // Strip Tailwind opacity variable trick
  v = v.replace(/\s*\/\s*var\(--tw-[^)]+\)/g, '');
  // Convert px → pt (PDF layout unit: 1px = 0.75pt).
  // This prevents lineHeight numbers being mis-interpreted as unitless ratios by measureText.
  v = v.replace(/(\d*\.?\d+)px/g, (_, n: string) => {
    const pt = parseFloat(n) * 0.75;
    return `${Number.isInteger(pt) ? pt : parseFloat(pt.toFixed(4))}pt`;
  });
  return v.trim();
}

// Process CSS: unwrap @layer blocks (their rules are needed) and strip all
// other @-rules (@media, @keyframes, @supports, @font-face, etc.).
// Uses brace-counting to avoid regex-based brace mismatches.
function stripAtRules(css: string): string {
  let out = '';
  let i = 0;

  while (i < css.length) {
    const atIdx = css.indexOf('@', i);
    if (atIdx === -1) {
      out += css.slice(i);
      break;
    }
    // Copy everything before the @-rule
    out += css.slice(i, atIdx);

    // Find the opening brace of this @-rule
    const braceIdx = css.indexOf('{', atIdx);
    const semiIdx = css.indexOf(';', atIdx);

    // @-rules with no block (e.g. @import, @charset) — skip to semicolon
    if (semiIdx !== -1 && (braceIdx === -1 || semiIdx < braceIdx)) {
      i = semiIdx + 1;
      continue;
    }

    if (braceIdx === -1) {
      // No opening brace found — skip to end
      break;
    }

    const ruleName = css.slice(atIdx, braceIdx).trimEnd();
    const isLayer = /^@layer\b/.test(ruleName);

    // Find the matching closing brace using brace counting
    let depth = 1;
    let j = braceIdx + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }

    const inner = css.slice(braceIdx + 1, j - 1);

    if (isLayer) {
      // @layer: recurse into its content so nested rules are kept
      out += stripAtRules(inner);
    }
    // All other @-rules: discard entirely

    i = j;
  }

  return out;
}

export function parseCssToStyleMap(css: string): Map<string, ResolvedStyle> {
  const map = new Map<string, ResolvedStyle>();
  const vars = parseCssVars(css);
  const cleaned = stripAtRules(css);

  // Match .className { declarations } — class name may contain escaped chars
  const ruleRe = /\.((?:[a-zA-Z0-9_\-\\:./[\]%@#!])+)\s*\{([^}]*)\}/g;
  let m = ruleRe.exec(cleaned);
  while (m !== null) {
    const rawName = m[1] ?? '';
    const decls = m[2] ?? '';

    // Skip pseudo-class / pseudo-element selectors (unescaped colon)
    if (/(?<!\\):/.test(rawName)) {
      m = ruleRe.exec(cleaned);
      continue;
    }

    // Unescape: \/ → /, \[ → [, \] → ], etc.
    const className = rawName.replace(/\\(.)/g, '$1');

    const style: Partial<Record<keyof ResolvedStyle, unknown>> = {};
    const declRe = /([\w-]+)\s*:\s*([^;!]+)/g;
    let d = declRe.exec(decls);
    while (d !== null) {
      const prop = d[1]?.trim() ?? '';
      const rawVal = d[2]?.trim() ?? '';
      if (!prop.startsWith('--')) {
        const key = PROP_MAP[prop];
        if (key !== undefined) {
          const val = resolveValue(rawVal, vars);
          if (val) {
            style[key] = val;
            // padding-inline sets both paddingLeft and paddingRight
            if (prop === 'padding-inline') {
              style.paddingRight = val;
            }
            // padding-block sets both paddingTop and paddingBottom
            if (prop === 'padding-block') {
              style.paddingBottom = val;
            }
          }
        }
      }
      d = declRe.exec(decls);
    }

    if (Object.keys(style).length > 0) {
      const existing = map.get(className) ?? {};
      map.set(className, { ...existing, ...style } as ResolvedStyle);
    }
    m = ruleRe.exec(cleaned);
  }

  return map;
}
