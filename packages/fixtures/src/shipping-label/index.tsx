import { Document, Page } from '@imprint-pdf/react';
import { Barcode } from '../components/Barcode.js';
import type { ShippingLabelData } from './sample.js';

export type { Address, ShippingLabelData } from './sample.js';
export { shippingLabelSample } from './sample.js';

export interface ShippingLabelProps {
  data: ShippingLabelData;
}

export function ShippingLabel({ data }: ShippingLabelProps) {
  return (
    <Document title={`Shipping Label ${data.trackingNumber}`} author={data.carrier}>
      <Page
        size={[288, 432]}
        sizeUnit="pt"
        className="flex flex-col bg-white p-2 font-sans text-black"
      >
        <div className="flex h-full flex-col border-[3px] border-black">
          {/* Inverted carrier bar with country badge */}
          <div className="flex flex-row items-center justify-between bg-black px-3 py-2.5">
            <span className="text-[20px] font-bold uppercase tracking-[0.5pt] text-white">
              {data.carrier}
            </span>
            <div className="flex items-center justify-center border-2 border-white px-2 py-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[1pt] text-white">
                {data.to.country}
              </span>
            </div>
          </div>

          {/* Inverted service-class strip (mono weight) */}
          <div className="flex flex-row items-center justify-between border-b-[3px] border-black bg-black px-3 py-1.5">
            <span className="text-[15px] font-bold uppercase tracking-[1.5pt] text-white">
              {data.service}
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[1pt] text-white">
              {data.weight}
            </span>
          </div>

          {/* FROM block - small */}
          <div className="flex flex-col border-b-[3px] border-black px-3 py-2">
            <span className="text-[7px] font-bold uppercase tracking-[1.5pt] text-black">From</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase leading-tight text-black">
              {data.from.name}
            </span>
            <span className="text-[8px] font-semibold uppercase leading-snug text-black">
              {data.from.line1}
              {data.from.line2 ? `, ${data.from.line2}` : ''} · {data.from.cityStateZip} ·{' '}
              {data.from.country}
            </span>
          </div>

          {/* SHIP TO block - dominant, fills remaining space */}
          <div className="flex flex-1 flex-col border-b-[3px] border-black px-3 pb-3 pt-3.5">
            <span className="text-[7px] font-bold uppercase tracking-[1.5pt] text-black">
              Ship To
            </span>
            <span className="mt-1 text-[26px] font-bold uppercase leading-none text-black">
              {data.to.name}
            </span>
            <span className="mt-2.5 text-[15px] font-bold uppercase leading-tight text-black">
              {data.to.line1}
            </span>
            {data.to.line2 ? (
              <span className="text-[15px] font-bold uppercase leading-tight text-black">
                {data.to.line2}
              </span>
            ) : null}
            <span className="mt-1 text-[18px] font-bold uppercase leading-tight text-black">
              {data.to.cityStateZip}
            </span>
            <span className="mt-1 text-[13px] font-bold uppercase leading-tight text-black">
              {data.to.country}
            </span>
          </div>

          {/* Boxed ship-date / weight / class row (mono) */}
          <div className="flex flex-row border-b-[3px] border-black">
            <div className="flex flex-1 flex-col border-r-2 border-black px-3 py-1.5">
              <span className="text-[7px] font-bold uppercase tracking-[1.5pt] text-black">
                Ship Date
              </span>
              <span className="font-mono text-[11px] font-bold text-black">{data.shipDate}</span>
            </div>
            <div className="flex flex-1 flex-col border-r-2 border-black px-3 py-1.5">
              <span className="text-[7px] font-bold uppercase tracking-[1.5pt] text-black">
                Weight
              </span>
              <span className="font-mono text-[11px] font-bold text-black">{data.weight}</span>
            </div>
            <div className="flex flex-[1.4] flex-col px-3 py-1.5">
              <span className="text-[7px] font-bold uppercase tracking-[1.5pt] text-black">
                Class
              </span>
              <span className="font-mono text-[11px] font-bold uppercase leading-tight text-black">
                {data.service}
              </span>
            </div>
          </div>

          {/* Full-width tracking barcode */}
          <div className="flex flex-col items-center px-3 pb-2 pt-2.5">
            <Barcode value={data.trackingNumber} width={262} height={62} />
            <span className="mt-1.5 font-mono text-[13px] font-bold tracking-[1pt] text-black">
              {data.trackingNumber}
            </span>
            <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[2.5pt] text-black">
              Tracking Number
            </span>
          </div>
        </div>
      </Page>
    </Document>
  );
}
