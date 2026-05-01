import type { SvgElement } from './parser.js';

const num = (s: string | undefined, d = 0): number => (s == null ? d : parseFloat(s) || 0);

/** Converts an SVG primitive shape to its equivalent path `d` string. */
export function shapeToPath(el: SvgElement): string | null {
  const a = el.attrs;
  switch (el.tag) {
    case 'path':
      return a.d ?? null;
    case 'rect': {
      const x = num(a.x);
      const y = num(a.y);
      const w = num(a.width);
      const h = num(a.height);
      const rx = num(a.rx, num(a.ry));
      const ry = num(a.ry, num(a.rx));
      if (w <= 0 || h <= 0) return null;
      if (rx > 0 || ry > 0) {
        const rxc = Math.min(rx, w / 2);
        const ryc = Math.min(ry, h / 2);
        return [
          `M ${x + rxc} ${y}`,
          `H ${x + w - rxc}`,
          `A ${rxc} ${ryc} 0 0 1 ${x + w} ${y + ryc}`,
          `V ${y + h - ryc}`,
          `A ${rxc} ${ryc} 0 0 1 ${x + w - rxc} ${y + h}`,
          `H ${x + rxc}`,
          `A ${rxc} ${ryc} 0 0 1 ${x} ${y + h - ryc}`,
          `V ${y + ryc}`,
          `A ${rxc} ${ryc} 0 0 1 ${x + rxc} ${y}`,
          `Z`,
        ].join(' ');
      }
      return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
    }
    case 'circle': {
      const cx = num(a.cx);
      const cy = num(a.cy);
      const r = num(a.r);
      if (r <= 0) return null;
      return [
        `M ${cx - r} ${cy}`,
        `A ${r} ${r} 0 1 0 ${cx + r} ${cy}`,
        `A ${r} ${r} 0 1 0 ${cx - r} ${cy}`,
        `Z`,
      ].join(' ');
    }
    case 'ellipse': {
      const cx = num(a.cx);
      const cy = num(a.cy);
      const rx = num(a.rx);
      const ry = num(a.ry);
      if (rx <= 0 || ry <= 0) return null;
      return [
        `M ${cx - rx} ${cy}`,
        `A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}`,
        `A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`,
        `Z`,
      ].join(' ');
    }
    case 'line': {
      return `M ${num(a.x1)} ${num(a.y1)} L ${num(a.x2)} ${num(a.y2)}`;
    }
    case 'polyline':
    case 'polygon': {
      const pts = (a.points ?? '')
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (pts.length < 4) return null;
      const cmds: string[] = [`M ${pts[0]} ${pts[1]}`];
      for (let i = 2; i < pts.length; i += 2) cmds.push(`L ${pts[i]} ${pts[i + 1]}`);
      if (el.tag === 'polygon') cmds.push('Z');
      return cmds.join(' ');
    }
  }
  return null;
}
