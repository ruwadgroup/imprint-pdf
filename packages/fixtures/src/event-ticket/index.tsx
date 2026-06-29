import { Document, Page } from '@imprint-pdf/react';
import { QrCode } from '../components/Barcode.js';
import type { EventTicketData } from './sample.js';

export type { EventTicketData } from './sample.js';
export { eventTicketSample } from './sample.js';

export interface EventTicketProps {
  data: EventTicketData;
}

// Vibrant modern concert ticket. Bold full-bleed violet field on the body, a
// perforated stub on the right in deeper indigo. Sans (Inter) throughout, mono
// for the scan/ticket code. Fixed 540x220 - keep within the size, no overflow.

/** Eyebrow-labelled detail cell, light type on the accent field. */
function Detail({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className ?? ''}`}>
      <span className="text-2xs font-bold uppercase tracking-[1.5pt] text-violet-300">{label}</span>
      <span className="mt-0.5 text-base font-bold leading-none text-white">{value}</span>
      {sub && <span className="mt-0.5 text-2xs leading-snug text-violet-200">{sub}</span>}
    </div>
  );
}

export function EventTicket({ data }: EventTicketProps) {
  return (
    <Document title={data.eventName} author={data.brand}>
      <Page
        size={[540, 220]}
        sizeUnit="pt"
        className="flex flex-row bg-violet-700 font-sans text-white"
      >
        {/* Main ticket body - full-bleed violet accent field */}
        <div className="flex flex-1 flex-col bg-violet-700 px-6 py-4">
          {/* Top row: brand + LIVE pill */}
          <div className="flex flex-row items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[3pt] text-violet-200">
              {data.brand}
            </span>
            <span className="flex flex-row items-center gap-1 rounded-full bg-white px-2.5 py-1">
              <span className="h-1 w-1 rounded-full bg-violet-700" />
              <span className="text-2xs font-bold uppercase tracking-[2pt] text-violet-700">
                Live
              </span>
            </span>
          </div>

          {/* Hero: BIG confident event title */}
          <div className="mt-3">
            <span className="text-2xs font-bold uppercase tracking-[2pt] text-violet-300">
              Presenting
            </span>
            <h1 className="mt-1 text-3xl font-bold leading-[0.92] tracking-[-0.6pt] text-white">
              {data.eventName}
            </h1>
            <p className="mt-1.5 text-2xs leading-snug text-violet-200">{data.subtitle}</p>
          </div>

          <div className="flex-1" />

          {/* Light hairline above the detail grid */}
          <div className="h-px bg-white/20" />

          {/* Eyebrow-labelled detail grid */}
          <div className="mt-3 flex flex-row items-start justify-between">
            <Detail label="Date" value={data.date} className="w-[150px]" />
            <Detail label="Doors" value={data.doors} className="w-12" />
            <Detail
              label="Venue"
              value={data.venue}
              sub={data.venueAddress}
              className="w-[132px]"
            />
          </div>
          <div className="mt-2.5 flex flex-row items-start gap-6">
            <Detail label="Section" value={data.section} />
            <Detail label="Row" value={data.row} />
            <Detail label="Seat" value={data.seat} />
            <Detail label="Gate" value={data.gate} />
          </div>
        </div>

        {/* Perforated vertical stub - deeper indigo for contrast */}
        <div className="flex w-[156px] flex-col items-center justify-between border-l-[1.5px] border-dashed border-white/45 bg-indigo-900 px-4 py-4">
          {/* Stacked ADMIT ONE */}
          <div className="flex flex-col items-center">
            <span className="text-base font-bold uppercase leading-none tracking-[4pt] text-white">
              Admit
            </span>
            <span className="mt-1 text-base font-bold uppercase leading-none tracking-[4pt] text-violet-300">
              One
            </span>
          </div>

          {/* QR in a crisp white chip */}
          <div className="rounded-md bg-white p-2">
            <QrCode value={data.qrValue} size={82} />
          </div>

          {/* Scan caption + mono ticket id */}
          <div className="flex flex-col items-center">
            <span className="text-2xs font-bold uppercase tracking-[2pt] text-violet-300">
              Scan at gate
            </span>
            <span className="mt-1 font-mono text-2xs font-bold tracking-[0.5pt] text-white">
              {data.ticketId}
            </span>
          </div>
        </div>
      </Page>
    </Document>
  );
}
