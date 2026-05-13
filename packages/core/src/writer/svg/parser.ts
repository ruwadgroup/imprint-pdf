export interface SvgElement {
  tag: string;
  attrs: Record<string, string>;
  children: SvgElement[];
  text?: string;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(s: string): string {
  return s.replace(/&(\w+);/g, (m, name) => ENTITIES[name as keyof typeof ENTITIES] ?? m);
}

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration
  while ((m = re.exec(raw)) !== null) {
    out[m[1] as string] = decodeEntities((m[3] ?? m[4]) as string);
  }
  return out;
}

export function parseSvg(source: string): SvgElement | null {
  const trimmed = source.replace(/<!--[\s\S]*?-->/g, '').trim();
  const stack: SvgElement[] = [];
  let root: SvgElement | null = null;
  const re =
    /<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)([^>]*?)\/>|<([a-zA-Z][\w:-]*)([^>]*?)>|([^<]+)/g;
  const attach = (el: SvgElement) => {
    if (stack.length === 0) root = el;
    else stack[stack.length - 1]!.children.push(el);
  };
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration
  while ((m = re.exec(trimmed)) !== null) {
    if (m[1]) {
      stack.pop();
    } else if (m[2]) {
      attach({ tag: m[2], attrs: parseAttrs(m[3] ?? ''), children: [] });
    } else if (m[4]) {
      const el: SvgElement = { tag: m[4], attrs: parseAttrs(m[5] ?? ''), children: [] };
      attach(el);
      stack.push(el);
    } else if (m[6]) {
      const text = decodeEntities(m[6]).trim();
      if (text && stack.length > 0) stack[stack.length - 1]!.text = text;
    }
  }
  return root;
}

export function findById(root: SvgElement, id: string): SvgElement | null {
  if (root.attrs.id === id) return root;
  for (const c of root.children) {
    const hit = findById(c, id);
    if (hit) return hit;
  }
  return null;
}
