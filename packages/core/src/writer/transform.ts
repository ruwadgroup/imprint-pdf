// PDF transformation matrix in [a b c d e f] order (PDF spec §8.3.3).
// Equivalent to the 3×3 affine matrix [[a b 0][c d 0][e f 1]].
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
  // We don't model a real font cascade, so 1em ≈ 12pt. Good enough for the
  // sub-pixel transform offsets people actually use; if it isn't, write px.
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

/**
 * Parses a CSS `transform` string into a PDF CTM, with all transforms applied
 * around (ox, oy) in PDF coordinates (y-up). Returns null if nothing parses.
 *
 * Two coordinate-system gotchas to keep straight:
 *   - PDF y is up, CSS y is down. Anything that touches y (translateY, the
 *     sin terms in rotate, translate's second arg) is sign-flipped.
 *   - CSS rotation is clockwise visually, which in PDF y-up space means the
 *     standard CCW rotation matrix with b and c swapped in sign.
 */
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
    let t: M6 | null = null;

    if (fn === 'rotate' || fn === 'rotateZ') {
      const θ = parseDeg(args[0] ?? '0');
      const cos = Math.cos(θ);
      const sin = Math.sin(θ);
      t = [cos, -sin, sin, cos, 0, 0];
    } else if (fn === 'translateX') {
      t = [1, 0, 0, 1, parseUnit(args[0] ?? '0'), 0];
    } else if (fn === 'translateY') {
      t = [1, 0, 0, 1, 0, -parseUnit(args[0] ?? '0')];
    } else if (fn === 'translate') {
      t = [1, 0, 0, 1, parseUnit(args[0] ?? '0'), -parseUnit(args[1] ?? '0')];
    } else if (fn === 'scale') {
      const sx = parseFloat(args[0] ?? '1');
      const sy = parseFloat(args[1] ?? args[0] ?? '1');
      t = [sx, 0, 0, sy, 0, 0];
    } else if (fn === 'scaleX') {
      t = [parseFloat(args[0] ?? '1'), 0, 0, 1, 0, 0];
    } else if (fn === 'scaleY') {
      t = [1, 0, 0, parseFloat(args[0] ?? '1'), 0, 0];
    } else if (fn === 'skewX') {
      t = [1, 0, Math.tan(parseDeg(args[0] ?? '0')), 1, 0, 0];
    } else if (fn === 'skewY') {
      t = [1, Math.tan(parseDeg(args[0] ?? '0')), 0, 1, 0, 0];
    } else if (fn === 'matrix') {
      // Pass-through: callers using matrix() are usually copying values from a
      // tool that already speaks our matrix dialect, so don't try to be clever.
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

  // Apply transform-origin by sandwiching the local matrix between two
  // translations: T(ox, oy) · M · T(-ox, -oy). Expanded out, only the
  // translation terms (e, f) change, so we don't bother with two extra muls.
  const [ma, mb, mc, md, me, mf] = m;
  return [ma, mb, mc, md, me + ox * (1 - ma) - oy * mc, mf + oy * (1 - md) - ox * mb];
}
