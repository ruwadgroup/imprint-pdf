import type { ResolvedStyle } from '@imprint-pdf/core';

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
  // Logical shorthands — the parse loop fans these out to both physical sides.
  'padding-inline': 'paddingLeft',
  'padding-block': 'paddingTop',
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
  'border-top-left-radius': 'borderTopLeftRadius',
  'border-top-right-radius': 'borderTopRightRadius',
  'border-bottom-right-radius': 'borderBottomRightRadius',
  'border-bottom-left-radius': 'borderBottomLeftRadius',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'font-style': 'fontStyle',
  'font-variation-settings': 'fontVariationSettings',
  'font-stretch': 'fontStretch',
  'font-feature-settings': 'fontFeatureSettings',
  'line-height': 'lineHeight',
  'letter-spacing': 'letterSpacing',
  'text-align': 'textAlign',
  'text-decoration-line': 'textDecoration',
  'text-decoration': 'textDecoration',
  'text-transform': 'textTransform',
  'white-space': 'whiteSpace',
  'text-overflow': 'textOverflow',
  'word-spacing': 'wordSpacing',
  'writing-mode': 'writingMode',
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
  transform: 'transform',
  'transform-origin': 'transformOrigin',
  'box-shadow': 'boxShadow',
  'background-image': 'backgroundImage',
  'object-position': 'objectPosition',
  'aspect-ratio': 'aspectRatio',
};

// Pre-extract :root custom properties so var() lookups don't rescan the CSS.
function parseCssVars(css: string): Map<string, string> {
  const vars = new Map<string, string>();
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

// Manual depth-walk — var() fallbacks can nest parens like
// `var(--x, calc(1px + 2px))`, which a flat regex can't handle.
function parseVarCall(
  str: string,
  start: number,
): { name: string; fallback: string | null; end: number } | null {
  if (!str.startsWith('var(', start)) return null;
  let depth = 1;
  let i = start + 4;
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

// Depth cap guards against self-referential token graphs.
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

// Handles +, -, *, / over numbers and px/rem. The regex restricts eval input
// to digits and operators — anything else passes through unchanged.
function resolveCalc(value: string): string {
  if (!value.includes('calc(')) return value;
  return value.replace(/calc\(([^)]+)\)/g, (_, expr: string) => {
    try {
      const hasDimension = /\d(?:\.\d+)?(?:rem|px|em|pt)/.test(expr);
      const withPx = expr.replace(/(\d*\.?\d+)rem/g, (__, n: string) => `${parseFloat(n) * 16}`);
      const noUnits = withPx.replace(/(\d*\.?\d+)px/g, '$1');
      if (/^[\d\s+\-*/().]+$/.test(noUnits)) {
        // biome-ignore lint/security/noGlobalEval: input is regex-restricted to digits and operators
        const result = eval(noUnits) as number;
        return hasDimension ? `${result}px` : `${result}`;
      }
    } catch {}
    return expr;
  });
}

// Tailwind v4 ships its default palette in oklch(); pdf-lib only understands
// hex/rgb. Matrix coefficients are from CSS Color 4 §11.3 (OKLab → linear
// sRGB) followed by the standard sRGB transfer function. Out-of-gamut values
// are clamped per channel — good enough for document chrome, not
// colorimetrically correct.
function oklchToHex(l: number, c: number, h: number): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;

  let r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  let g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  let bv = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;

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
  v = v.replace(/(\d*\.?\d+)rem/g, (_, n: string) => `${parseFloat(n) * 16}px`);
  // Tailwind smuggles per-class opacity through a `/ var(--tw-text-opacity)`
  // suffix. PDF colors don't carry alpha, so drop the divisor and let the
  // surrounding `opacity` property handle it.
  v = v.replace(/\s*\/\s*var\(--tw-[^)]+\)/g, '');
  // Always emit pt with an explicit unit — downstream measurement code must
  // not mistake a length (e.g. `line-height: 24`) for a unitless ratio.
  v = v.replace(/(\d*\.?\d+)px/g, (_, n: string) => {
    const pt = parseFloat(n) * 0.75;
    return `${Number.isInteger(pt) ? pt : parseFloat(pt.toFixed(4))}pt`;
  });
  return v.trim();
}

// Tailwind v4 emits everything inside @layer blocks. Keep their bodies and
// drop every other at-rule (@media/@keyframes/@supports/@font-face). Brace
// counting handles nested blocks that a flat regex can't match safely.
function stripAtRules(css: string): string {
  let out = '';
  let i = 0;

  while (i < css.length) {
    const atIdx = css.indexOf('@', i);
    if (atIdx === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, atIdx);

    const braceIdx = css.indexOf('{', atIdx);
    const semiIdx = css.indexOf(';', atIdx);

    // Statement-form at-rule (@import, @charset). Skip past the terminator.
    if (semiIdx !== -1 && (braceIdx === -1 || semiIdx < braceIdx)) {
      i = semiIdx + 1;
      continue;
    }

    if (braceIdx === -1) break;

    const ruleName = css.slice(atIdx, braceIdx).trimEnd();
    const isLayer = /^@layer\b/.test(ruleName);

    let depth = 1;
    let j = braceIdx + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }

    const inner = css.slice(braceIdx + 1, j - 1);

    // @layer bodies can contain their own at-rules, so recurse instead of
    // splicing the raw inner back in.
    if (isLayer) {
      out += stripAtRules(inner);
    }

    i = j;
  }

  return out;
}

export function parseCssToStyleMap(css: string): Map<string, ResolvedStyle> {
  const map = new Map<string, ResolvedStyle>();
  const vars = parseCssVars(css);
  const cleaned = stripAtRules(css);

  // Tailwind class names contain CSS-escape-required chars (`/`, `[`, `]`,
  // `%`, ...), so the selector regex accepts the escape and we strip the
  // backslash later.
  const ruleRe = /\.((?:[a-zA-Z0-9_\-\\:./[\]%@#!])+)\s*\{([^}]*)\}/g;
  let m = ruleRe.exec(cleaned);
  while (m !== null) {
    const rawName = m[1] ?? '';
    const decls = m[2] ?? '';

    // Unescaped colon = pseudo selector (`.btn:hover`). Can't model state-
    // less, so skip the rule rather than half-applying it.
    if (/(?<!\\):/.test(rawName)) {
      m = ruleRe.exec(cleaned);
      continue;
    }

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
            // Logical shorthands fan out to both physical sides.
            if (prop === 'padding-inline') {
              style.paddingRight = val;
            }
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
