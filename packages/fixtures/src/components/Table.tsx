import type { ReactNode } from 'react';

type Align = 'left' | 'center' | 'right';

interface RowProps {
  children: ReactNode;
  className?: string;
}

interface CellProps {
  children: ReactNode;
  align?: Align;
  flex?: boolean;
  width?: number;
  className?: string;
}

function alignClass(align: Align) {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return '';
}

export function Table({ children, className = '' }: RowProps) {
  return <table className={`flex flex-col ${className}`}>{children}</table>;
}

// Row - stretches all cells to the same height so content can be vertically centered.
export function Tr({ children, className = '' }: RowProps) {
  return <tr className={`flex flex-row items-stretch ${className}`}>{children}</tr>;
}

// Header cell. Horizontal padding belongs on <Tr> so fixed column widths aren't eaten by cell padding.
export function Th({ children, align = 'left', flex, width, className = '' }: CellProps) {
  return (
    <th
      className={`flex flex-col justify-center py-2 ${flex ? 'flex-1' : ''} ${className}`}
      style={width !== undefined ? { width } : undefined}
    >
      <span className={`text-xs font-bold text-white tracking-[1pt] ${alignClass(align)}`}>
        {String(children)}
      </span>
    </th>
  );
}

// Data cell - accepts string/number (auto-wrapped in span) or ReactNode.
export function Td({ children, align = 'left', flex, width, className = '' }: CellProps) {
  const isScalar = typeof children === 'string' || typeof children === 'number';
  return (
    <td
      className={`flex flex-col justify-center py-2.5 ${flex ? 'flex-1' : ''} ${className}`}
      style={width !== undefined ? { width } : undefined}
    >
      {isScalar ? (
        <span className={`text-xs text-slate-900 ${alignClass(align)}`}>{String(children)}</span>
      ) : (
        children
      )}
    </td>
  );
}
