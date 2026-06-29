import type { CSSProperties, ReactNode } from 'react';

type Align = 'left' | 'center' | 'right';

interface RowProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

interface CellProps {
  children: ReactNode;
  align?: Align;
  flex?: boolean;
  width?: number;
  /** Applied to the auto-wrapped text span (type, weight, colour). */
  className?: string;
  /** Applied to the cell wrapper (background, padding overrides). */
  cellClassName?: string;
  style?: CSSProperties;
}

function alignClass(align: Align) {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return '';
}

export function Table({ children, className = '', style }: RowProps) {
  return (
    <table className={`flex flex-col ${className}`} style={style}>
      {children}
    </table>
  );
}

// Row - stretches all cells to the same height so content can vertically centre.
export function Tr({ children, className = '', style }: RowProps) {
  return (
    <tr className={`flex flex-row items-stretch ${className}`} style={style}>
      {children}
    </tr>
  );
}

function cellWrapper(flex: boolean | undefined, cellClassName: string) {
  return `flex flex-col justify-center py-2 ${flex ? 'flex-1' : ''} ${cellClassName}`.trim();
}

// Header cell. Text styling is caller-controlled via `className`; only layout
// lives on the wrapper so any palette works (light text on dark, etc.).
export function Th({
  children,
  align = 'left',
  flex,
  width,
  className = 'text-[9px] font-semibold uppercase tracking-[1pt] text-white',
  cellClassName = '',
  style,
}: CellProps) {
  return (
    <th
      className={cellWrapper(flex, cellClassName)}
      style={{ ...(width !== undefined ? { width } : {}), ...style }}
    >
      <span className={`${alignClass(align)} ${className}`.trim()}>{String(children)}</span>
    </th>
  );
}

// Data cell - scalars are auto-wrapped in a styled span; ReactNode passes through.
export function Td({
  children,
  align = 'left',
  flex,
  width,
  className = 'text-[10px] text-slate-800',
  cellClassName = '',
  style,
}: CellProps) {
  const isScalar = typeof children === 'string' || typeof children === 'number';
  return (
    <td
      className={cellWrapper(flex, cellClassName)}
      style={{ ...(width !== undefined ? { width } : {}), ...style }}
    >
      {isScalar ? (
        <span className={`${alignClass(align)} ${className}`.trim()}>{String(children)}</span>
      ) : (
        children
      )}
    </td>
  );
}
