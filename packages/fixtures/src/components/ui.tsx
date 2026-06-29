import type { ReactNode } from 'react';

// A couple of trivial shared bits the templates repeat a lot. Everything else
// is written inline in each template with plain Tailwind - these are sample
// documents, not a configurable component library, so there's no need for a
// prop-heavy design system.

/** Uppercase tracked label - the "eyebrow" above headings/fields. */
export function Eyebrow({
  children,
  className = 'text-slate-400',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`text-2xs font-semibold uppercase tracking-[1.5pt] ${className}`}>
      {children}
    </span>
  );
}

/** Rounded status pill - deltas, tags. Pass full Tailwind colour classes. */
export function Pill({
  children,
  className = 'bg-green-100 text-green-700',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-2xs font-bold tracking-[0.3pt] ${className}`}>
      {children}
    </span>
  );
}
