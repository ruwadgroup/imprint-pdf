/** PDF transformation matrix `[a b c d e f]` (PDF §8.3.3). */
type M6 = [number, number, number, number, number, number];

function mul(m1: M6, m2: M6): M6 {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

function parseUnit(s: string): number {
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  // No font cascade inside transforms — `1em` ≈ 12pt. Use px when precision matters.
  if (s.endsWith('em') || s.endsWith('rem')) return n * 12;
  return n;
}

function parseDeg(s: string): number {
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  if (s.endsWith('rad')) return n;
  if (s.endsWith('turn')) return n * Math.PI * 2;
  return (n * Math.PI) / 180;
}

/** Parse a CSS `transform` into a PDF CTM pivoted at `(ox, oy)` (PDF y-up). `null` if nothing parsed. */
export function buildTransformMatrix(css: string, ox: number, oy: number): M6 | null {
  let m: M6 = [1, 0, 0, 1, 0, 0];
  let hasAny = false;

  const re = /(\w+)\(([^)]*)\)/g;
  let match: RegExpExecArray | null = re.exec(css);

  while (match !== null) {
    const fn = match[1]!;
    const args = match[2]!
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    const a0 = args[0] ?? '0';
    let t: M6 | null = null;

    if (fn === 'rotate' || fn === 'rotateZ') {
      const θ = parseDeg(a0);
      const cos = Math.cos(θ);
      const sin = Math.sin(θ);
      t = [cos, -sin, sin, cos, 0, 0];
    } else if (fn === 'translateX') {
      t = [1, 0, 0, 1, parseUnit(a0), 0];
    } else if (fn === 'translateY') {
      t = [1, 0, 0, 1, 0, -parseUnit(a0)];
    } else if (fn === 'translate') {
      t = [1, 0, 0, 1, parseUnit(a0), -parseUnit(args[1] ?? '0')];
    } else if (fn === 'scale') {
      const sx = parseFloat(args[0] ?? '1');
      const sy = parseFloat(args[1] ?? args[0] ?? '1');
      t = [sx, 0, 0, sy, 0, 0];
    } else if (fn === 'scaleX') {
      t = [parseFloat(args[0] ?? '1'), 0, 0, 1, 0, 0];
    } else if (fn === 'scaleY') {
      t = [1, 0, 0, parseFloat(args[0] ?? '1'), 0, 0];
    } else if (fn === 'skewX') {
      t = [1, 0, Math.tan(parseDeg(a0)), 1, 0, 0];
    } else if (fn === 'skewY') {
      t = [1, Math.tan(parseDeg(a0)), 0, 1, 0, 0];
    } else if (fn === 'matrix') {
      const [a, b, c, d, e, f] = args.map(parseFloat);
      t = [a ?? 1, b ?? 0, c ?? 0, d ?? 1, e ?? 0, f ?? 0];
    }

    if (t) {
      m = mul(m, t);
      hasAny = true;
    }
    match = re.exec(css);
  }

  if (!hasAny) return null;

  // Inline expansion of `T(ox,oy) · M · T(-ox,-oy)` (transform-origin pivot).
  const [ma, mb, mc, md, me, mf] = m;
  return [ma, mb, mc, md, me + ox * (1 - ma) - oy * mc, mf + oy * (1 - md) - ox * mb];
}
