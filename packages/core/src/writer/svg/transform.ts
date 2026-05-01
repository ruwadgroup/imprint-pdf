/** 2D affine matrix `[a b c d e f]` applied as (x,y) → (a·x + c·y + e, b·x + d·y + f). */
export type Mat = [number, number, number, number, number, number];

export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

export function multiply(a: Mat, b: Mat): Mat {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

const TOKEN = /([a-zA-Z]+)\s*\(([^)]*)\)/g;

function nums(s: string): number[] {
  return (s.match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
}

export function parseTransform(input: string | undefined): Mat {
  if (!input) return IDENTITY;
  let acc: Mat = IDENTITY;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration
  while ((m = TOKEN.exec(input)) !== null) {
    const op = (m[1] ?? '').toLowerCase();
    const v = nums(m[2] ?? '');
    switch (op) {
      case 'matrix':
        if (v.length === 6) acc = multiply(acc, v as Mat);
        break;
      case 'translate':
        acc = multiply(acc, [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0]);
        break;
      case 'scale': {
        const sx = v[0] ?? 1;
        const sy = v[1] ?? sx;
        acc = multiply(acc, [sx, 0, 0, sy, 0, 0]);
        break;
      }
      case 'rotate': {
        const rad = ((v[0] ?? 0) * Math.PI) / 180;
        const cx = v[1] ?? 0;
        const cy = v[2] ?? 0;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        if (cx || cy) {
          acc = multiply(acc, [1, 0, 0, 1, cx, cy]);
          acc = multiply(acc, [cos, sin, -sin, cos, 0, 0]);
          acc = multiply(acc, [1, 0, 0, 1, -cx, -cy]);
        } else {
          acc = multiply(acc, [cos, sin, -sin, cos, 0, 0]);
        }
        break;
      }
      case 'skewx':
        acc = multiply(acc, [1, 0, Math.tan(((v[0] ?? 0) * Math.PI) / 180), 1, 0, 0]);
        break;
      case 'skewy':
        acc = multiply(acc, [1, Math.tan(((v[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0]);
        break;
    }
  }
  return acc;
}
