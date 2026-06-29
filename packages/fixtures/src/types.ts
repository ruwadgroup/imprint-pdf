import { type ComponentType, createElement, type ReactElement } from 'react';

/**
 * A document fixture in the corpus. Runtime-agnostic by contract: references
 * only `@imprint-pdf/react` components, never `pdf()` - consumers pick their
 * own `pdf()` entry (node vs standalone) and call `render()`.
 *
 * Prop-erased at the registry boundary: consumers read metadata and call
 * `render()`; `defineDoc` keeps the per-document prop types honest at authoring.
 */
export interface DocEntry {
  id: string;
  title: string;
  description: string;
  features: string[];
  render: () => ReactElement;
}

export function defineDoc<P>(entry: {
  id: string;
  title: string;
  description: string;
  features: string[];
  Component: ComponentType<P>;
  /** Deterministic sample props (no clock or RNG). */
  sampleProps: P;
}): DocEntry {
  const { Component, sampleProps, ...meta } = entry;
  // The public signature already pins `sampleProps: P` to `Component`'s props;
  // erase here so createElement isn't fighting the generic's class-component variance.
  const C = Component as ComponentType<Record<string, unknown>>;
  const props = sampleProps as Record<string, unknown>;
  return { ...meta, render: () => createElement(C, props) };
}
