import type { PdfNode, PdfNodeType, ResolvedStyle, VariantStyles } from '@imprint-pdf/core/browser';
import { resolveStylesWithVariants, shortHash } from '@imprint-pdf/core/browser';
import React, { type ReactElement } from 'react';
import type ReactReconcilerType from 'react-reconciler';

// Indirect through `React.createContext` — a bare named import trips Next's
// RSC heuristic and tags this module as a Client Component.
const createContext = React.createContext;

const IS_REACT_18 = parseInt(String(React.version ?? '19').split('.')[0] ?? '19', 10) < 19;

type ReconcilerModuleShape = typeof ReactReconcilerType | { default: typeof ReactReconcilerType };
type ConstantsModuleShape = { DefaultEventPriority: number; LegacyRoot: number };

// Both reconcilers are loaded via `await import('react-reconciler-XX')` with
// literal specifiers so nft traces them into `.next/standalone` while routes
// that never render PDFs pay nothing at module load. The dynamic imports live
// inside an async function so the module stays sync-importable. One reconciler
// is picked per process from `React.version` and memoised in `reconcilerCache`.
interface ReconcilerCache {
  reconciler: {
    createContainer: (...args: unknown[]) => unknown;
    updateContainer: (element: ReactElement | null, root: unknown) => unknown;
    updateContainerSync?: (element: ReactElement | null, root: unknown) => unknown;
    flushSyncWork?: () => void;
  };
  DefaultEventPriority: number;
  LegacyRoot: number;
}
let reconcilerCache: ReconcilerCache | undefined;
let reconcilerPending: Promise<ReconcilerCache> | undefined;

async function loadReconciler(): Promise<ReconcilerCache> {
  if (reconcilerCache) return reconcilerCache;
  reconcilerPending ??= (async () => {
    const [reconcilerMod, constantsMod] = IS_REACT_18
      ? await Promise.all([
          import('react-reconciler-18'),
          import('react-reconciler-18/constants.js'),
        ])
      : await Promise.all([
          import('react-reconciler-19'),
          import('react-reconciler-19/constants.js'),
        ]);

    const reconcilerExport = reconcilerMod as unknown as ReconcilerModuleShape;
    const ReactReconciler =
      (reconcilerExport as { default?: typeof ReactReconcilerType }).default ??
      (reconcilerExport as typeof ReactReconcilerType);
    const { DefaultEventPriority, LegacyRoot } = constantsMod as unknown as ConstantsModuleShape;

    const hostConfig = buildHostConfig(DefaultEventPriority) as ReactReconcilerType.HostConfig<
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
    >;

    const reconciler = ReactReconciler(hostConfig) as unknown as ReconcilerCache['reconciler'];
    reconcilerCache = { reconciler, DefaultEventPriority, LegacyRoot };
    return reconcilerCache;
  })();

  return reconcilerPending;
}

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
  return IMPRINT_TYPES[type] ?? HTML_ALIASES[type] ?? 'view';
}

function resolveStyle(
  className: string | undefined,
  style: Record<string, unknown> | undefined,
): { style: ResolvedStyle; variants: VariantStyles } {
  return resolveStylesWithVariants(className, style as Partial<ResolvedStyle> | undefined);
}

function makeIdGenerator() {
  let counter = 0;
  return () => {
    counter += 1;
    return shortHash(String(counter));
  };
}

// R18 vs R19 host-config drift: R19 adds 16 transition/priority/suspense/form/paint
// fields, `commitUpdate` is 4-arg (vs 5-arg on R18), `createContainer` takes
// 10 args (vs 5), and `updateContainerSync`/`flushSyncWork` are R19-only.
// Gate the extras on `IS_REACT_18` and read `newProps` from the last
// `commitUpdate` arg either way. Return type is `unknown` so the two
// `@types/react-reconciler` majors don't clash structurally.
function buildHostConfig(DefaultEventPriority: number): unknown {
  const core = {
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
      const { className, style, children: _children, ...restProps } = props;
      const resolved = resolveStyle(
        className as string | undefined,
        style as Record<string, unknown> | undefined,
      );

      // Tailwind's two-pass pipeline reads className back off the tree.
      const nodeProps: Record<string, unknown> = { ...restProps };
      if (className != null) nodeProps.className = className;

      const node: PdfNode = {
        type: mapType(type),
        id: rootContainer.nextId(),
        props: nodeProps,
        style: resolved.style,
        children: [],
      } as PdfNode;
      if (Object.keys(resolved.variants).length > 0) node.variants = resolved.variants;
      return node;
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
      if (idx === -1) parentInstance.children.push(child);
      else parentInstance.children.splice(idx, 0, child);
    },

    insertInContainerBefore(container: Container, child: PdfNode, _beforeChild: PdfNode): void {
      container.document = child;
    },

    removeChild(parentInstance: PdfNode, child: PdfNode): void {
      const idx = parentInstance.children.indexOf(child);
      if (idx !== -1) parentInstance.children.splice(idx, 1);
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

    commitTextUpdate(textInstance: PdfNode, _oldText: string, newText: string): void {
      if (textInstance.type === 'text') textInstance.text = newText;
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

    // R18 only. `true` is the standard "commit me" sentinel for non-DOM hosts.
    // Ignored on R19.
    prepareUpdate(): unknown {
      return true;
    },
  };

  // newProps is the last arg on both R18 (5-arg) and R19 (4-arg).
  function commitUpdate(...args: unknown[]): void {
    const instance = args[0] as PdfNode;
    const newProps = args[args.length - 1] as Record<string, unknown>;
    const { className, style, children: _children, ...restProps } = newProps;
    const resolved = resolveStyle(
      className as string | undefined,
      style as Record<string, unknown> | undefined,
    );
    instance.style = resolved.style;
    if (Object.keys(resolved.variants).length > 0) instance.variants = resolved.variants;
    else delete instance.variants;
    Object.assign(instance.props, restProps);
    if (className != null) instance.props.className = className;
  }

  if (IS_REACT_18) {
    return { ...core, commitUpdate };
  }

  // R19-only fields. Inert defaults — R19 uses them for transition/suspense/
  // priority bookkeeping the PDF host doesn't care about.
  const r19Extensions = {
    commitUpdate,
    resetFormInstance(_form: never): void {},
    NotPendingTransition: null,
    // Wants a ReactContext<never> with internals React doesn't expose. Never read here.
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

  return { ...core, ...r19Extensions };
}

if (typeof globalThis !== 'undefined' && !('__REACT_DEVTOOLS_GLOBAL_HOOK__' in globalThis)) {
  (globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
}

// R18 createContainer: 5 args. R19: 10 args (trailing id prefix + error callbacks
// we ignore). updateContainer on R18 is already sync under LegacyRoot, so the
// Sync variant is R19-only.
function buildPdfNodeTreeImpl(
  cache: ReconcilerCache,
  container: Container,
  element: ReactElement,
): void {
  const { reconciler, LegacyRoot } = cache;
  const root = IS_REACT_18
    ? reconciler.createContainer(container, LegacyRoot, null, false, null)
    : reconciler.createContainer(
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

  if (reconciler.updateContainerSync) {
    reconciler.updateContainerSync(element, root);
    reconciler.flushSyncWork?.();
  } else {
    reconciler.updateContainer(element, root);
  }
}

// React splits `<Text>Hello {name}</Text>` into separate text instances. Taffy
// would measure each one independently and break lines wrong, so merge them.
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

export async function buildPdfNodeTree(element: ReactElement): Promise<PdfNode> {
  const cache = await loadReconciler();
  const container: Container = { document: null, nextId: makeIdGenerator() };
  buildPdfNodeTreeImpl(cache, container, element);

  if (container.document === null) {
    throw new Error(
      '[imprint] buildPdfNodeTree: reconciler produced no root node. ' +
        'Make sure the top-level element is <Document>.',
    );
  }

  collapseTextChildren(container.document);
  return container.document;
}
