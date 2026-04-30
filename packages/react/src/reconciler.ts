import type { PdfNode, PdfNodeType, ResolvedStyle } from '@imprint/core';
import { resolveStyles, shortHash } from '@imprint/core';
import { createContext, type ReactElement } from 'react';
import ReactReconciler from 'react-reconciler';
import { DefaultEventPriority, LegacyRoot } from 'react-reconciler/constants.js';

export interface Container {
  document: PdfNode | null;
  nextId: () => string;
}

type HostContext = Record<string, never>;

const HTML_ALIASES: Record<string, PdfNodeType> = {
  div: 'view',
  p: 'view',
  h1: 'view',
  h2: 'view',
  h3: 'view',
  h4: 'view',
  h5: 'view',
  h6: 'view',
  span: 'view',
  ul: 'view',
  ol: 'view',
  li: 'view',
  table: 'view',
  thead: 'view',
  tbody: 'view',
  tfoot: 'view',
  tr: 'view',
  td: 'view',
  th: 'view',
  a: 'link',
  img: 'image',
  section: 'view',
  article: 'view',
  aside: 'view',
  header: 'view',
  footer: 'view',
  main: 'view',
  nav: 'view',
  figure: 'view',
  figcaption: 'view',
  blockquote: 'view',
  pre: 'view',
  code: 'view',
  strong: 'view',
  em: 'view',
  small: 'view',
  label: 'view',
};

const IMPRINT_TYPES: Record<string, PdfNodeType> = {
  'imprint-document': 'document',
  'imprint-page': 'page',
  'imprint-image': 'image',
  'imprint-svg': 'svg',
  'imprint-link': 'link',
  'imprint-form': 'form',
  'imprint-textfield': 'textfield',
  'imprint-checkbox': 'checkbox',
  'imprint-radiogroup': 'radiogroup',
  'imprint-dropdown': 'dropdown',
  'imprint-signature': 'signature',
  'imprint-button': 'button',
  'imprint-chart': 'chart',
  'imprint-pagebreak': 'pagebreak',
  'imprint-header': 'header',
  'imprint-footer': 'footer',
  'imprint-watermark': 'watermark',
  'imprint-bookmark': 'bookmark',
};

function mapType(type: string): PdfNodeType {
  if (type in IMPRINT_TYPES) return IMPRINT_TYPES[type] as PdfNodeType;
  if (type in HTML_ALIASES) return HTML_ALIASES[type] as PdfNodeType;
  return 'view';
}

function resolveStyle(
  className: string | undefined,
  style: Record<string, unknown> | undefined,
): ResolvedStyle {
  return resolveStyles(className, style as Partial<ResolvedStyle> | undefined);
}

function makeIdGenerator() {
  let counter = 0;
  return () => {
    counter += 1;
    return shortHash(String(counter));
  };
}

const hostConfig: ReactReconciler.HostConfig<
  string,
  Record<string, unknown>,
  Container,
  PdfNode,
  PdfNode,
  never,
  never,
  never,
  PdfNode,
  HostContext,
  never,
  ReturnType<typeof setTimeout>,
  -1,
  never
> = {
  isPrimaryRenderer: true,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1 as const,

  getRootHostContext(_rootContainer: Container): HostContext {
    return {};
  },
  getChildHostContext(
    _parentContext: HostContext,
    _type: string,
    _rootContainer: Container,
  ): HostContext {
    return {};
  },

  shouldSetTextContent(_type: string, _props: Record<string, unknown>): boolean {
    return false;
  },

  createInstance(
    type: string,
    props: Record<string, unknown>,
    rootContainer: Container,
    _hostContext: HostContext,
  ): PdfNode {
    const nodeType = mapType(type);
    const { className, style, children: _children, ...restProps } = props;
    const resolvedStyle = resolveStyle(
      className as string | undefined,
      style as Record<string, unknown> | undefined,
    );

    // The two-pass Tailwind pipeline reads className back off the tree to
    // collect candidates, so it has to survive on the node alongside style.
    const nodeProps: Record<string, unknown> = { ...restProps };
    if (className != null) {
      nodeProps.className = className;
    }

    return {
      type: nodeType,
      id: rootContainer.nextId(),
      props: nodeProps,
      style: resolvedStyle,
      children: [],
    } as PdfNode;
  },

  createTextInstance(text: string, rootContainer: Container, _hostContext: HostContext): PdfNode {
    return {
      type: 'text',
      id: rootContainer.nextId(),
      text,
      props: {},
      style: {},
      children: [],
    } as PdfNode;
  },

  appendInitialChild(parentInstance: PdfNode, child: PdfNode): void {
    parentInstance.children.push(child);
  },

  appendChild(parentInstance: PdfNode, child: PdfNode): void {
    parentInstance.children.push(child);
  },

  appendChildToContainer(container: Container, child: PdfNode): void {
    container.document = child;
  },

  insertBefore(parentInstance: PdfNode, child: PdfNode, beforeChild: PdfNode): void {
    const idx = parentInstance.children.indexOf(beforeChild);
    if (idx === -1) {
      parentInstance.children.push(child);
    } else {
      parentInstance.children.splice(idx, 0, child);
    }
  },

  insertInContainerBefore(container: Container, child: PdfNode, _beforeChild: PdfNode): void {
    container.document = child;
  },

  removeChild(parentInstance: PdfNode, child: PdfNode): void {
    const idx = parentInstance.children.indexOf(child);
    if (idx !== -1) {
      parentInstance.children.splice(idx, 1);
    }
  },

  removeChildFromContainer(container: Container, _child: PdfNode): void {
    container.document = null;
  },

  clearContainer(container: Container): void {
    container.document = null;
  },

  finalizeInitialChildren(
    _instance: PdfNode,
    _type: string,
    _props: Record<string, unknown>,
    _rootContainer: Container,
    _hostContext: HostContext,
  ): boolean {
    return false;
  },

  prepareForCommit(_container: Container): Record<string, unknown> | null {
    return null;
  },

  resetAfterCommit(_container: Container): void {},

  commitUpdate(
    instance: PdfNode,
    _type: string,
    _oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>,
  ): void {
    const { className, style, children: _children, ...restProps } = newProps;
    instance.style = resolveStyle(
      className as string | undefined,
      style as Record<string, unknown> | undefined,
    );
    Object.assign(instance.props, restProps);
    if (className != null) {
      instance.props.className = className;
    }
  },

  resetFormInstance(_form: never): void {},
  commitTextUpdate(textInstance: PdfNode, _oldText: string, newText: string): void {
    if (textInstance.type === 'text') {
      textInstance.text = newText;
    }
  },

  getPublicInstance(instance: PdfNode): PdfNode {
    return instance;
  },

  getInstanceFromNode(_node: unknown): null {
    return null;
  },

  beforeActiveInstanceBlur(): void {},
  afterActiveInstanceBlur(): void {},
  prepareScopeUpdate(_scopeInstance: unknown, _instance: unknown): void {},

  getInstanceFromScope(_scopeInstance: unknown): PdfNode | null {
    return null;
  },

  detachDeletedInstance(_node: PdfNode): void {},
  preparePortalMount(_container: Container): void {},

  NotPendingTransition: null,
  // The HostConfig type wants a real ReactContext<never> with internal fields
  // React doesn't expose. We never read this in PDF rendering, so we hand back
  // a regular Context coerced through `never` rather than re-implementing it.
  HostTransitionContext: createContext<never>(null as never) as never,

  resolveUpdatePriority(): number {
    return DefaultEventPriority;
  },

  setCurrentUpdatePriority(_newPriority: number): void {},

  getCurrentUpdatePriority(): number {
    return DefaultEventPriority;
  },

  requestPostPaintCallback(_callback: (time: number) => void): void {},

  shouldAttemptEagerTransition(): boolean {
    return false;
  },

  trackSchedulerEvent(): void {},

  resolveEventType(): string | null {
    return null;
  },

  resolveEventTimeStamp(): number {
    return -1;
  },

  maySuspendCommit(_type: string, _props: Record<string, unknown>): boolean {
    return false;
  },

  preloadInstance(_type: string, _props: Record<string, unknown>): boolean {
    return true;
  },

  startSuspendingCommit(): void {},

  suspendInstance(_type: string, _props: Record<string, unknown>): void {},

  waitForCommitToBeReady(): null {
    return null;
  },
};

const reconciler = ReactReconciler(hostConfig);

if (typeof globalThis !== 'undefined' && !('__REACT_DEVTOOLS_GLOBAL_HOOK__' in globalThis)) {
  (globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
}

// React splits text into one TextInstance per JSX expression, e.g.
// `<Text>Hello {name}</Text>` becomes ["Hello ", name]. Taffy measures each
// child independently, which produces wrong line breaks. Merge sibling text
// nodes into one and inherit the parent's style so font metrics line up.
function collapseTextChildren(node: PdfNode): void {
  if (node.children.length > 0 && node.children.every((c) => c.type === 'text')) {
    const merged = node.children.map((c) => (c.type === 'text' ? (c.text ?? '') : '')).join('');
    const first = node.children[0];
    if (first) {
      node.children = [{ ...first, text: merged, style: node.style, children: [] }];
    }
  } else {
    for (const child of node.children) collapseTextChildren(child);
  }
}

export function buildPdfNodeTree(element: ReactElement): PdfNode {
  const container: Container = { document: null, nextId: makeIdGenerator() };

  const root = reconciler.createContainer(
    container,
    LegacyRoot,
    null,
    false,
    null,
    '',
    () => {},
    () => {},
    () => {},
    () => {},
  );

  reconciler.updateContainerSync(element, root, null, null);
  reconciler.flushSyncWork();

  if (container.document !== null) collapseTextChildren(container.document);

  if (container.document === null) {
    throw new Error(
      '[imprint] buildPdfNodeTree: reconciler produced no root node. ' +
        'Make sure the top-level element is <Document>.',
    );
  }

  return container.document;
}
