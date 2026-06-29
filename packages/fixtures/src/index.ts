import { Analytics, analyticsSample } from './analytics/index.js';
import { BankStatement, bankStatementSample } from './bank-statement/index.js';
import { BoardingPass, boardingPassSample } from './boarding-pass/index.js';
import { Certificate, certificateSample } from './certificate/index.js';
import { Contract, contractSample } from './contract/index.js';
import { CoverLetter, coverLetterSample } from './cover-letter/index.js';
import { Datasheet, datasheetSample } from './datasheet/index.js';
import { EventTicket, eventTicketSample } from './event-ticket/index.js';
import { Invoice, invoiceSample } from './invoice/index.js';
import { fontSets } from './lib/fonts.js';
import { Menu, menuSample } from './menu/index.js';
import { Receipt, receiptSample } from './receipt/index.js';
import { Report, reportSample } from './report/index.js';
import { Resume, resumeSample } from './resume/index.js';
import { ShippingLabel, shippingLabelSample } from './shipping-label/index.js';
import { TaxForm, taxFormSample } from './tax-form/index.js';
import { type DocEntry, defineDoc } from './types.js';

export type { DocEntry } from './types.js';
export { defineDoc } from './types.js';

/**
 * The document corpus. Authored once; consumed by the render test, the
 * benchmark suite, and every per-runtime example adapter. Each entry references
 * only `@imprint-pdf/react` components, never `pdf()`.
 */
export const documents: DocEntry[] = [
  defineDoc({
    id: 'invoice',
    title: 'Invoice',
    description: 'Line-item invoice with a totals block and tax.',
    features: ['tables', 'totals', 'tailwind'],
    fonts: fontSets.corporate,
    Component: Invoice,
    sampleProps: { data: invoiceSample },
  }),
  defineDoc({
    id: 'receipt',
    title: 'Receipt',
    description: 'Narrow ~80mm thermal-style receipt with line items, totals, and a scan barcode.',
    features: ['narrow', 'compact', 'barcode'],
    fonts: fontSets.mono,
    Component: Receipt,
    sampleProps: { data: receiptSample },
  }),
  defineDoc({
    id: 'resume',
    title: 'Resume',
    description: 'Two-column CV with a colored sidebar and a typographic main column.',
    features: ['two-column', 'typography'],
    fonts: fontSets.editorial,
    Component: Resume,
    sampleProps: { data: resumeSample },
  }),
  defineDoc({
    id: 'cover-letter',
    title: 'Cover letter',
    description:
      'Formal serif cover letter with letterhead, recipient block, and prose paragraphs.',
    features: ['prose', 'letterhead'],
    fonts: fontSets.editorial,
    Component: CoverLetter,
    sampleProps: { data: coverLetterSample },
  }),
  defineDoc({
    id: 'certificate',
    title: 'Certificate',
    description: 'Landscape certificate of achievement with double border, watermark, and seal.',
    features: ['centered', 'watermark', 'landscape'],
    fonts: fontSets.ceremonial,
    Component: Certificate,
    sampleProps: { data: certificateSample },
  }),
  defineDoc({
    id: 'report',
    title: 'Financial report',
    description:
      'Quarterly report with KPI cards, a revenue bar chart, and a multi-page ledger with running header, footer, and page numbers.',
    features: ['multi-page', 'header-footer', 'page-numbers', 'charts'],
    fonts: fontSets.corporateMono,
    Component: Report,
    sampleProps: { data: reportSample },
  }),
  defineDoc({
    id: 'bank-statement',
    title: 'Bank statement',
    description:
      'Monthly statement with masked account details, balance summary, and a dense multi-page transaction table with running balance.',
    features: ['dense-table', 'multi-page', 'running-balance'],
    fonts: fontSets.corporateMono,
    Component: BankStatement,
    sampleProps: { data: bankStatementSample },
  }),
  defineDoc({
    id: 'boarding-pass',
    title: 'Boarding pass',
    description: 'Fixed-size airline boarding pass with a dashed stub, QR code, and barcode strip.',
    features: ['qr', 'barcode', 'fixed-layout'],
    fonts: fontSets.corporate,
    Component: BoardingPass,
    sampleProps: { data: boardingPassSample },
  }),
  defineDoc({
    id: 'event-ticket',
    title: 'Event ticket',
    description: 'Wide branded event ticket with a QR code and a perforated ADMIT ONE stub.',
    features: ['qr', 'branding'],
    fonts: fontSets.corporate,
    Component: EventTicket,
    sampleProps: { data: eventTicketSample },
  }),
  defineDoc({
    id: 'shipping-label',
    title: 'Shipping label',
    description: '4×6 in carrier label with FROM/TO blocks, service class, and a tracking barcode.',
    features: ['label', 'barcode', 'fixed-size'],
    fonts: fontSets.corporateMono,
    Component: ShippingLabel,
    sampleProps: { data: shippingLabelSample },
  }),
  defineDoc({
    id: 'menu',
    title: 'Restaurant menu',
    description: 'Editorial two-column menu with dotted price leaders and section headers.',
    features: ['multi-column', 'editorial'],
    fonts: fontSets.menu,
    Component: Menu,
    sampleProps: { data: menuSample },
  }),
  defineDoc({
    id: 'contract',
    title: 'Contract (NDA)',
    description: 'Multi-page mutual NDA with numbered clauses and a two-party signature block.',
    features: ['long-text', 'signature', 'page-breaks'],
    fonts: fontSets.editorial,
    Component: Contract,
    sampleProps: { data: contractSample },
  }),
  defineDoc({
    id: 'tax-form',
    title: 'Tax form (W-9)',
    description:
      'Fillable W-9-style AcroForm with text fields, radios, checkboxes, and a dropdown.',
    features: ['acroform', 'fillable'],
    fonts: fontSets.corporate,
    Component: TaxForm,
    sampleProps: { data: taxFormSample },
  }),
  defineDoc({
    id: 'datasheet',
    title: 'Product datasheet',
    description:
      'A4 spec sheet with an inline-SVG illustration and a technical specifications table.',
    features: ['spec-table', 'image'],
    fonts: fontSets.corporate,
    Component: Datasheet,
    sampleProps: { data: datasheetSample },
  }),
  defineDoc({
    id: 'analytics',
    title: 'Analytics dashboard',
    description:
      'KPI card grid with an inline-SVG bar chart, a conversion line chart, and a ranked table.',
    features: ['charts', 'dashboard', 'svg'],
    fonts: fontSets.corporateMono,
    Component: Analytics,
    sampleProps: { data: analyticsSample },
  }),
];

export function byId(id: string): DocEntry | undefined {
  return documents.find((d) => d.id === id);
}
