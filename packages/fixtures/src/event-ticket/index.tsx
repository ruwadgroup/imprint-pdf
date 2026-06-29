import { Document, Page } from '@imprint-pdf/react';
import { QrCode } from '../components/Barcode.js';
import type { EventTicketData } from './sample.js';

export type { EventTicketData } from './sample.js';
export { eventTicketSample } from './sample.js';

export interface EventTicketProps {
  data: EventTicketData;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-bold text-slate-400 tracking-[1pt]">{label}</span>
      <span className="text-[11px] font-bold text-slate-900 mt-0.5">{value}</span>
    </div>
  );
}

export function EventTicket({ data }: EventTicketProps) {
  return (
    <Document title={data.eventName} author={data.brand}>
      <Page
        className="bg-white font-sans text-slate-900 flex flex-row"
        style={{ width: 540, height: 220 }}
      >
        <div className="flex flex-row flex-1">
          <div
            className="flex flex-col justify-between bg-indigo-700 px-5 py-4"
            style={{ width: 150 }}
          >
            <span className="text-[10px] font-bold text-indigo-200 tracking-[2pt]">
              {data.brand}
            </span>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white leading-tight">{data.eventName}</h1>
              <p className="text-[9px] text-indigo-200 mt-1 leading-snug">{data.subtitle}</p>
            </div>
            <span className="text-[8px] text-indigo-300 tracking-[1pt]">{data.ticketId}</span>
          </div>

          <div className="flex flex-col flex-1 px-5 py-4">
            <div className="flex flex-col mb-3">
              <span className="text-[8px] font-bold text-slate-400 tracking-[1pt]">
                DATE & TIME
              </span>
              <span className="text-[13px] font-bold text-slate-900 mt-0.5">{data.date}</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Doors {data.doors}</span>
            </div>
            <div className="flex flex-col mb-3">
              <span className="text-[8px] font-bold text-slate-400 tracking-[1pt]">VENUE</span>
              <span className="text-[12px] font-bold text-slate-900 mt-0.5">{data.venue}</span>
              <span className="text-[9px] text-slate-500">{data.venueAddress}</span>
            </div>
            <div className="flex-1" />
            <div className="flex flex-row justify-between">
              <Detail label="SECTION" value={data.section} />
              <Detail label="ROW" value={data.row} />
              <Detail label="SEAT" value={data.seat} />
              <Detail label="GATE" value={data.gate} />
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-center justify-between border-l-2 border-dashed border-slate-300 px-4 py-4"
          style={{ width: 150 }}
        >
          <span className="text-[10px] font-bold text-indigo-700 tracking-[2pt]">ADMIT ONE</span>
          <QrCode value={data.qrValue} size={96} />
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-slate-400 tracking-[1pt]">SCAN AT GATE</span>
            <span className="text-[9px] font-mono font-bold text-slate-700 mt-0.5">
              {data.ticketId}
            </span>
          </div>
        </div>
      </Page>
    </Document>
  );
}
