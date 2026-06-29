export function money(n: number, currency = 'USD'): string {
  return n.toLocaleString('en-US', { style: 'currency', currency });
}

export function num(n: number): string {
  return n.toLocaleString('en-US');
}

export function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + pick(row), 0);
}
