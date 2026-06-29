import { Document, Page } from '@imprint-pdf/react/standalone';
import { Barcode, QrCode } from '../components/Barcode.js';
import type { BoardingPassData } from './sample.js';

export type { BoardingPassData } from './sample.js';
export { boardingPassSample } from './sample.js';

export interface BoardingPassProps {
  data: BoardingPassData;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[7pt] font-semibold tracking-[1pt] text-slate-400 uppercase">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

export function BoardingPass({ data }: BoardingPassProps) {
  return (
    <Document title={`Boarding Pass - ${data.flight}`} author={data.airline}>
      <Page
        size="A4"
        className="bg-white font-sans text-slate-900"
        style={{ width: 560, height: 220 }}
      >
        <div className="flex flex-row" style={{ width: 560, height: 220 }}>
          <div className="flex flex-col flex-1 px-5 py-4">
            <div className="flex flex-row justify-between items-center border-b border-slate-200 pb-2">
              <div className="flex flex-row items-center">
                <div className="bg-indigo-600 rounded mr-2" style={{ width: 18, height: 18 }} />
                <span className="text-sm font-bold tracking-tight text-indigo-700">
                  {data.airline}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">BOARDING PASS</span>
            </div>

            <div className="flex flex-row items-center justify-between mt-3">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">{data.from.code}</span>
                <span className="text-[7pt] text-slate-500">{data.from.city}</span>
              </div>
              <div className="flex flex-col items-center px-2">
                <div className="bg-indigo-500 rounded-full" style={{ width: 12, height: 12 }} />
                <span className="text-[7pt] text-slate-400 mt-0.5">{data.date}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">{data.to.code}</span>
                <span className="text-[7pt] text-slate-500">{data.to.city}</span>
              </div>
            </div>

            <div className="flex flex-col mt-3">
              <span className="text-[7pt] font-semibold tracking-[1pt] text-slate-400 uppercase">
                Passenger
              </span>
              <span className="text-sm font-bold text-slate-900">{data.passenger}</span>
            </div>

            <div className="flex flex-row justify-between mt-2">
              <Field label="Flight" value={data.flight} />
              <Field label="Gate" value={data.gate} />
              <Field label="Boarding" value={data.boarding} />
              <Field label="Seat" value={data.seat} />
            </div>

            <div className="flex-1" />
            <Barcode value={data.barcodeValue} width={300} height={26} className="mt-2" />
          </div>

          <div
            className="flex flex-col items-center justify-between px-4 py-4 border-l-2 border-dashed border-slate-300 bg-slate-50"
            style={{ width: 150 }}
          >
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-indigo-700">{data.airline}</span>
              <span className="text-[7pt] text-slate-400 mt-0.5">{data.class}</span>
            </div>

            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-slate-900">{data.from.code}</span>
              </div>
              <span className="text-sm font-bold text-slate-400">&gt;</span>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-slate-900">{data.to.code}</span>
              </div>
            </div>

            <QrCode value={data.barcodeValue} size={88} />

            <div className="flex flex-row justify-between w-full">
              <div className="flex flex-col items-center">
                <span className="text-[7pt] text-slate-400 uppercase">Seat</span>
                <span className="text-xs font-bold text-slate-900">{data.seat}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7pt] text-slate-400 uppercase">Grp</span>
                <span className="text-xs font-bold text-slate-900">{data.group}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7pt] text-slate-400 uppercase">Seq</span>
                <span className="text-xs font-bold text-slate-900">{data.sequence}</span>
              </div>
            </div>
          </div>
        </div>
      </Page>
    </Document>
  );
}
