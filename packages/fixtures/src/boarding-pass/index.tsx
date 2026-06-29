import { Document, Page } from '@imprint-pdf/react';
import { Barcode, QrCode } from '../components/Barcode.js';
import type { BoardingPassData } from './sample.js';

export type { BoardingPassData } from './sample.js';
export { boardingPassSample } from './sample.js';

export interface BoardingPassProps {
  data: BoardingPassData;
}

const PAGE_W = 600;
const PAGE_H = 232;

function Detail({
  label,
  value,
  mono = false,
  align = 'left',
}: {
  label: string;
  value: string;
  mono?: boolean;
  align?: 'left' | 'right';
}) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : ''}`}>
      <span className="text-2xs font-bold uppercase tracking-[1.4pt] text-slate-400">{label}</span>
      <span
        className={`mt-1 text-base font-bold tracking-[-0.2pt] text-slate-900 ${
          mono ? 'font-mono' : 'font-sans'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function BoardingPass({ data }: BoardingPassProps) {
  return (
    <Document title={`Boarding Pass - ${data.flight}`} author={data.airline}>
      <Page
        size={[PAGE_W, PAGE_H]}
        sizeUnit="pt"
        className="flex flex-row bg-white font-sans text-slate-900"
      >
        {/* ---- Full-height accent brand band ---- */}
        <div className="flex w-[26px] flex-col items-center gap-2 bg-indigo-700 py-4">
          <div className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-white">
            <span className="text-sm font-bold text-indigo-700">{data.airline.charAt(0)}</span>
          </div>
          <div className="h-1.5 w-1.5 rotate-45 bg-indigo-300" />
        </div>

        {/* ---- Main pass ---- */}
        <div className="flex flex-1 flex-col px-6 pb-4 pt-4">
          {/* Header: airline + class pill */}
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-baseline gap-2.5">
              <span className="text-base font-bold tracking-[-0.2pt] text-indigo-700">
                {data.airline}
              </span>
              <span className="text-2xs font-bold uppercase tracking-[2.5pt] text-slate-400">
                Boarding Pass
              </span>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-2xs font-bold uppercase tracking-[1.5pt] text-indigo-700">
              {data.class}
            </span>
          </div>

          {/* HUGE route line */}
          <div className="mt-3.5 flex flex-row items-center">
            <div className="flex flex-col">
              <span className="text-5xl font-bold leading-none tracking-[-1.5pt]">
                {data.from.code}
              </span>
              <span className="mt-1.5 text-2xs font-semibold uppercase tracking-[1pt] text-slate-500">
                {data.from.city}
              </span>
            </div>

            <div className="mx-4 flex flex-1 flex-col items-center">
              <div className="h-1.5 w-1.5 rotate-45 bg-indigo-700" />
              <div className="mt-1.5 w-full border-t-2 border-dotted border-slate-300" />
            </div>

            <div className="flex flex-col items-end">
              <span className="text-5xl font-bold leading-none tracking-[-1.5pt]">
                {data.to.code}
              </span>
              <span className="mt-1.5 text-2xs font-semibold uppercase tracking-[1pt] text-slate-500">
                {data.to.city}
              </span>
            </div>
          </div>

          {/* Passenger */}
          <div className="mt-3.5 flex flex-col">
            <span className="text-2xs font-bold uppercase tracking-[1.4pt] text-slate-400">
              Passenger
            </span>
            <span className="mt-1 text-lg font-bold tracking-[-0.3pt]">{data.passenger}</span>
          </div>

          {/* Detail grid */}
          <div className="mt-3 flex flex-row justify-between border-t border-slate-200 pt-3">
            <Detail label="Flight" value={data.flight} mono />
            <Detail label="Date" value={data.date} />
            <Detail label="Gate" value={data.gate} mono />
            <Detail label="Boarding" value={data.boarding} mono />
            <Detail label="Departs" value={data.departure} mono />
            <Detail label="Seat" value={data.seat} mono />
          </div>

          <div className="flex-1" />

          {/* Barcode strip */}
          <div className="flex flex-row items-end justify-between">
            <Barcode value={data.barcodeValue} width={300} height={28} />
            <span className="font-mono text-2xs tracking-[0.4pt] text-slate-400">
              {data.barcodeValue}
            </span>
          </div>
        </div>

        {/* ---- Perforated tear-off stub ---- */}
        <div className="flex w-[170px] flex-col border-l-2 border-dashed border-indigo-300 bg-indigo-50 px-4 pb-4 pt-4">
          <div className="flex flex-row items-center justify-between">
            <span className="text-sm font-bold tracking-[-0.2pt] text-indigo-700">
              {data.airline}
            </span>
            <span className="text-2xs font-bold uppercase tracking-[1.2pt] text-indigo-400">
              Stub
            </span>
          </div>

          <div className="mt-2 flex flex-row items-center justify-center">
            <span className="text-xl font-bold tracking-[-0.5pt]">{data.from.code}</span>
            <div className="mx-2 h-1 w-1 rotate-45 bg-indigo-700" />
            <span className="text-xl font-bold tracking-[-0.5pt]">{data.to.code}</span>
          </div>

          <div className="mt-2.5 flex flex-row justify-center">
            <div className="rounded bg-white p-1.5">
              <QrCode value={data.barcodeValue} size={74} />
            </div>
          </div>

          <div className="mt-auto flex flex-row justify-between pt-3">
            <Detail label="Seat" value={data.seat} mono />
            <Detail label="Flight" value={data.flight} mono align="right" />
          </div>
          <div className="mt-2 flex flex-row justify-between border-t border-indigo-200 pt-2">
            <Detail label="Grp" value={data.group} mono />
            <Detail label="Seq" value={data.sequence} mono align="right" />
          </div>
        </div>
      </Page>
    </Document>
  );
}
