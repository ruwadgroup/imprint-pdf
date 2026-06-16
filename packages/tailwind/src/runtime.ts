import type { ResolvedStyle } from '@imprint-pdf/core';

export const classMap: Record<string, ResolvedStyle> = {};
export const classList: string[] = [];

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

function readStyle(style: CSSStyleDeclaration, baseline: CSSStyleDeclaration): ResolvedStyle {
  const out: Partial<Record<keyof ResolvedStyle, string>> = {};

  for (const [prop, key] of Object.entries(PROP_MAP) as Array<[string, keyof ResolvedStyle]>) {
    const value = style.getPropertyValue(prop).trim();
    if (!value || value === baseline.getPropertyValue(prop).trim()) continue;
    if (value === 'normal' && (prop === 'font-style' || prop === 'font-stretch')) continue;
    out[key] = value;
  }

  return out as ResolvedStyle;
}

export function resolveBrowserClassMap(classes: Iterable<string>): Map<string, ResolvedStyle> {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return new Map();
  }

  const host = document.createElement('div');
  host.style.cssText = [
    'position:absolute',
    'left:-99999px',
    'top:-99999px',
    'visibility:hidden',
    'pointer-events:none',
    'contain:layout style paint',
  ].join(';');

  const baselineEl = document.createElement('div');
  const probe = document.createElement('div');
  host.append(baselineEl, probe);
  document.body.append(host);

  try {
    const baseline = window.getComputedStyle(baselineEl);
    const map = new Map<string, ResolvedStyle>();
    for (const cls of classes) {
      probe.className = cls;
      const resolved = readStyle(window.getComputedStyle(probe), baseline);
      if (Object.keys(resolved).length > 0) map.set(cls, resolved);
    }
    probe.className = '';
    return map;
  } finally {
    host.remove();
  }
}
