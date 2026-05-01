import type { NamedPageSize } from './layout/units.js';

export type PdfNodeType =
  | 'document'
  | 'page'
  | 'view'
  | 'text'
  | 'image'
  | 'svg'
  | 'link'
  | 'form'
  | 'textfield'
  | 'checkbox'
  | 'radiogroup'
  | 'dropdown'
  | 'signature'
  | 'button'
  | 'chart'
  | 'pagebreak'
  | 'header'
  | 'footer'
  | 'watermark'
  | 'bookmark';

export interface ResolvedStyle {
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  padding?: string | number;
  paddingTop?: string | number;
  paddingRight?: string | number;
  paddingBottom?: string | number;
  paddingLeft?: string | number;
  margin?: string | number;
  marginTop?: string | number;
  marginRight?: string | number;
  marginBottom?: string | number;
  marginLeft?: string | number;
  border?: string | number;
  borderWidth?: string | number;
  borderTopWidth?: string | number;
  borderRightWidth?: string | number;
  borderBottomWidth?: string | number;
  borderLeftWidth?: string | number;
  borderColor?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  borderRadius?: string | number;
  borderTopLeftRadius?: string | number;
  borderTopRightRadius?: string | number;
  borderBottomRightRadius?: string | number;
  borderBottomLeftRadius?: string | number;
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  alignSelf?: string;
  flex?: string | number;
  flexGrow?: string | number;
  flexShrink?: string | number;
  flexBasis?: string | number;
  gap?: string | number;
  rowGap?: string | number;
  columnGap?: string | number;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumn?: string;
  gridRow?: string;
  gridColumnSpan?: string | number;
  gridColumnStart?: string | number;
  gridColumnEnd?: string | number;
  gridRowStart?: string | number;
  gridRowEnd?: string | number;
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  fontStyle?: string;
  // CSS spec: `"wght" 700, "wdth" 80, "opsz" 12`. Quoted-tag/value pairs
  // separated by commas; numeric only (no `auto`/`normal`/`italic` keywords —
  // those map to font-weight/font-style/font-stretch).
  fontVariationSettings?: string;
  fontStretch?: string | number;
  fontFeatureSettings?: string;
  lineHeight?: string | number;
  letterSpacing?: string | number;
  textAlign?: string;
  textDecoration?: string;
  textTransform?: string;
  whiteSpace?: string;
  textOverflow?: string;
  wordSpacing?: string | number;
  // CSS `writing-mode`. `vertical-rl` (East Asian default) rotates glyphs
  // 90° clockwise and stacks lines right-to-left. `vertical-lr` is the
  // mirror. Currently affects draw only — layout still measures horizontal.
  writingMode?: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr' | string;
  lineClamp?: string | number;
  textIndent?: string | number;
  color?: string;
  transform?: string;
  transformOrigin?: string;
  boxShadow?: string;
  backgroundImage?: string;
  objectPosition?: string;
  aspectRatio?: string;
  opacity?: string | number;
  backgroundColor?: string;
  position?: string;
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  zIndex?: string | number;
  overflow?: string;
  overflowX?: string;
  overflowY?: string;
}

/** Either a named page size (derived from `PAGE_SIZES`) or an explicit `[w, h]` in points. */
export type PageSize = NamedPageSize | [number, number];

export type SizeUnit = 'pt' | 'mm' | 'cm' | 'in' | 'px';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageDefaults {
  size?: PageSize;
  sizeUnit?: SizeUnit;
  orientation?: PageOrientation;
}

export interface DocumentProps {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  lang?: string;
  intent?: string;
  outputIntent?: string;
  /** Files to embed as PDF attachments. */
  embeds?: Array<{ name: string; data: Uint8Array; mimeType: string; description?: string }>;
  /** Default size/orientation applied to all pages that don't specify their own. */
  pageDefaults?: PageDefaults;
  [key: string]: unknown;
}

export interface PageProps {
  size?: PageSize;
  sizeUnit?: SizeUnit;
  orientation?: PageOrientation;
  bleed?: number;
  marks?: boolean;
  [key: string]: unknown;
}

export interface ImageProps {
  src: string;
  alt?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  [key: string]: unknown;
}

export interface SvgProps {
  src: string;
  [key: string]: unknown;
}

export interface LinkProps {
  href: string;
  [key: string]: unknown;
}

export interface FormProps {
  name?: string;
  [key: string]: unknown;
}

export type TextFieldType = 'text' | 'password' | 'email' | 'number' | 'date' | 'tel';

export interface TextFieldProps {
  name: string;
  type?: TextFieldType;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
  defaultValue?: string;
  placeholder?: string;
  [key: string]: unknown;
}

export interface CheckboxProps {
  name: string;
  required?: boolean;
  defaultChecked?: boolean;
  [key: string]: unknown;
}

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  defaultValue?: string;
  [key: string]: unknown;
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  name: string;
  options: DropdownOption[];
  defaultValue?: string;
  [key: string]: unknown;
}

export interface SignatureProps {
  name: string;
  certificate?: string;
  privateKey?: string;
  [key: string]: unknown;
}

export interface ButtonProps {
  name: string;
  action?: string;
  [key: string]: unknown;
}

export interface ChartProps {
  width: number;
  height: number;
  [key: string]: unknown;
}

export interface BookmarkProps {
  title: string;
  level?: number;
  [key: string]: unknown;
}

// Variants whose match condition is known statically per page (first/left/
// right) or per output pipeline (bleed/cmyk). Resolved up front by the
// reconciler, applied per page in a pre-layout pass.
export type ImprintVariant = 'page-first' | 'page-left' | 'page-right' | 'bleed' | 'cmyk';

export type VariantStyles = Partial<Record<ImprintVariant, ResolvedStyle>>;

export interface BaseNode {
  type: PdfNodeType;
  id: string;
  props: Record<string, unknown>;
  style: ResolvedStyle;
  children: PdfNode[];
  variants?: VariantStyles;
}

export interface DocumentNode extends BaseNode {
  type: 'document';
  props: DocumentProps;
}

export interface PageNode extends BaseNode {
  type: 'page';
  props: PageProps;
}

export interface ViewNode extends BaseNode {
  type: 'view';
}

export interface TextNode extends BaseNode {
  type: 'text';
  text: string;
}

export interface ImageNode extends BaseNode {
  type: 'image';
  props: ImageProps;
}

export interface SvgNode extends BaseNode {
  type: 'svg';
  props: SvgProps;
}

export interface LinkNode extends BaseNode {
  type: 'link';
  props: LinkProps;
}

export interface FormNode extends BaseNode {
  type: 'form';
  props: FormProps;
}

export interface TextFieldNode extends BaseNode {
  type: 'textfield';
  props: TextFieldProps;
}

export interface CheckboxNode extends BaseNode {
  type: 'checkbox';
  props: CheckboxProps;
}

export interface RadioGroupNode extends BaseNode {
  type: 'radiogroup';
  props: RadioGroupProps;
}

export interface DropdownNode extends BaseNode {
  type: 'dropdown';
  props: DropdownProps;
}

export interface SignatureNode extends BaseNode {
  type: 'signature';
  props: SignatureProps;
}

export interface ButtonNode extends BaseNode {
  type: 'button';
  props: ButtonProps;
}

export interface ChartNode extends BaseNode {
  type: 'chart';
  props: ChartProps;
}

export interface PageBreakNode extends BaseNode {
  type: 'pagebreak';
}

export interface HeaderNode extends BaseNode {
  type: 'header';
}

export interface FooterNode extends BaseNode {
  type: 'footer';
}

export interface WatermarkNode extends BaseNode {
  type: 'watermark';
}

export interface BookmarkNode extends BaseNode {
  type: 'bookmark';
  props: BookmarkProps;
}

export type PdfNode =
  | DocumentNode
  | PageNode
  | ViewNode
  | TextNode
  | ImageNode
  | SvgNode
  | LinkNode
  | FormNode
  | TextFieldNode
  | CheckboxNode
  | RadioGroupNode
  | DropdownNode
  | SignatureNode
  | ButtonNode
  | ChartNode
  | PageBreakNode
  | HeaderNode
  | FooterNode
  | WatermarkNode
  | BookmarkNode;

export interface ComputedGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  contentWidth: number;
  contentHeight: number;
  /** Effective font family at this node (resolved through inheritance). Used by text rendering. */
  fontFamily?: string;
}

export interface FontDeclaration {
  family: string;
  src: string;
  weight?: number | string;
  style?: 'normal' | 'italic';
  format?: 'woff2' | 'woff' | 'ttf' | 'otf';
}

export interface AssetResolver {
  resolve(src: string): Promise<Uint8Array>;
  resolveText(src: string): Promise<string>;
}

export interface RenderOptions {
  fonts?: FontDeclaration[];
  tailwind?: { config?: string; stylesheet?: string; projectRoot?: string };
  assetResolver?: AssetResolver;
  debug?: boolean;
  /** Splits a word into syllables for paragraph hyphenation; typically `loadHyphenator(lang).hyphenate`. */
  hyphenate?: (word: string) => string[];
  /** Raster fallback for SVGs that use `<filter>`, soft `<mask>`, or `<foreignObject>`. */
  svgRasterizer?: SvgRasterizer;
}

export type SvgRasterizer = (
  svg: string,
  options: { width: number; height: number },
) => Promise<Uint8Array>;
