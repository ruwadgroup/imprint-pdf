import type { RenderOptions } from '@imprint-pdf/core';
import type { ReactElement } from 'react';
import type { PdfOptions } from './pdf.js';

export type { BookmarkProps } from './components/Bookmark.js';
export { Bookmark } from './components/Bookmark.js';
export type { ButtonProps } from './components/Button.js';
export { Button } from './components/Button.js';
export type { ChartProps } from './components/Chart.js';
export { Chart } from './components/Chart.js';
export type { CheckboxProps } from './components/Checkbox.js';
export { Checkbox } from './components/Checkbox.js';
export type { DocumentProps, PageDefaults } from './components/Document.js';
export { Document } from './components/Document.js';
export type { DropdownOption, DropdownProps } from './components/Dropdown.js';
export { Dropdown } from './components/Dropdown.js';
export type { FooterProps } from './components/Footer.js';
export { Footer } from './components/Footer.js';
export type { FormProps } from './components/Form.js';
export { Form } from './components/Form.js';
export type { HeaderProps } from './components/Header.js';
export { Header } from './components/Header.js';
export type { ImageProps } from './components/Image.js';
export { Image } from './components/Image.js';
export type { LinkProps } from './components/Link.js';
export { Link } from './components/Link.js';
export type { PageOrientation, PageProps, PageSize, SizeUnit } from './components/Page.js';
export { Page } from './components/Page.js';
export { PageNumber } from './components/PageNumber.js';
export type { RadioGroupProps, RadioOption } from './components/RadioGroup.js';
export { RadioGroup } from './components/RadioGroup.js';
export type { SignatureProps } from './components/Signature.js';
export { Signature } from './components/Signature.js';
export type { SvgProps } from './components/Svg.js';
export { Svg } from './components/Svg.js';
export type { TextFieldProps, TextFieldType } from './components/TextField.js';
export { TextField } from './components/TextField.js';
export { TotalPages } from './components/TotalPages.js';
export type { WatermarkProps } from './components/Watermark.js';
export { Watermark } from './components/Watermark.js';
export type { PdfOptions, PdfOutput } from './pdf.js';
export type { InspectorRenderResult } from './render-standalone.js';

export interface StandaloneRenderOptions extends RenderOptions {
  // v1: will be wired to the taffy layout engine and harfbuzz text shaper.
  wasm?: WebAssembly.Module;
}

export async function renderToStream(
  element: ReactElement,
  options: StandaloneRenderOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const { wasm: _wasm, ...renderOptions } = options;
  const { renderToStream: render } = await import('./render-standalone.js');
  return render(element, renderOptions);
}

export async function renderToBuffer(
  element: ReactElement,
  options: StandaloneRenderOptions = {},
): Promise<Uint8Array> {
  const { wasm: _wasm, ...renderOptions } = options;
  const { renderToBuffer: render } = await import('./render-standalone.js');
  return render(element, renderOptions);
}

/**
 * Edge entry point. Same overloads as `@imprint-pdf/react`'s `pdf`. Skips
 * config auto-load (no `node:fs`) — pass `options.fonts` and `options.tailwind`
 * explicitly on edge.
 */
export function pdf(
  element: ReactElement,
  options?: PdfOptions & { wasm?: WebAssembly.Module; as?: 'response' },
): Promise<Response>;
export function pdf(
  element: ReactElement,
  options: PdfOptions & { wasm?: WebAssembly.Module; as: 'bytes' },
): Promise<Uint8Array>;
export function pdf(
  element: ReactElement,
  options: PdfOptions & { wasm?: WebAssembly.Module; as: 'stream' },
): Promise<ReadableStream<Uint8Array>>;
export async function pdf(
  element: ReactElement,
  options: PdfOptions & { wasm?: WebAssembly.Module } = {},
): Promise<Response | Uint8Array | ReadableStream<Uint8Array>> {
  const { wasm: _wasm, ...rest } = options;
  const mod = (await import('./pdf-standalone.js')) as {
    pdf: (
      e: ReactElement,
      o?: PdfOptions,
    ) => Promise<Response | Uint8Array | ReadableStream<Uint8Array>>;
  };
  return mod.pdf(element, rest);
}
