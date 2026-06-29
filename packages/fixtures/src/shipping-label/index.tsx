import { Document, Page } from '@imprint-pdf/react/standalone';
import { Barcode } from '../components/Barcode.js';
import type { Address, ShippingLabelData } from './sample.js';

export type { Address, ShippingLabelData } from './sample.js';
export { shippingLabelSample } from './sample.js';

export interface ShippingLabelProps {
  data: ShippingLabelData;
}

function AddressBlock({ label, address }: { label: string; address: Address }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-bold text-slate-500 tracking-[1pt] mb-1">{label}</span>
      <span className="text-[11px] font-bold text-slate-900">{address.name}</span>
      <span className="text-[10px] text-slate-800">{address.line1}</span>
      {address.line2 ? <span className="text-[10px] text-slate-800">{address.line2}</span> : null}
      <span className="text-[10px] text-slate-800">{address.cityStateZip}</span>
      <span className="text-[10px] text-slate-800">{address.country}</span>
    </div>
  );
}

export function ShippingLabel({ data }: ShippingLabelProps) {
  return (
    <Document title={`Shipping Label ${data.trackingNumber}`} author={data.carrier}>
      <Page className="bg-white p-3 font-sans text-slate-900" style={{ width: 288, height: 432 }}>
        <div className="flex flex-row justify-between items-center bg-black px-3 py-2">
          <span className="text-base font-bold text-white tracking-[1pt]">{data.carrier}</span>
          <span className="text-[10px] font-bold text-white">{data.service}</span>
        </div>

        <div className="flex flex-row justify-between border-x border-b border-black px-3 py-2">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500">SHIP DATE</span>
            <span className="text-[11px] font-bold text-slate-900">{data.shipDate}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-slate-500">WEIGHT</span>
            <span className="text-[11px] font-bold text-slate-900">{data.weight}</span>
          </div>
        </div>

        <div className="flex flex-col border-x border-b border-black px-3 py-3">
          <AddressBlock label="FROM" address={data.from} />
        </div>

        <div className="flex flex-col border-x border-b-2 border-black px-3 py-3">
          <AddressBlock label="SHIP TO" address={data.to} />
        </div>

        <div className="flex-1" />

        <div className="flex flex-col items-center border-2 border-t-0 border-black px-3 pt-3 pb-3">
          <Barcode value={data.trackingNumber} width={260} height={64} />
          <span className="text-[12px] font-mono font-bold text-slate-900 mt-2 tracking-[1pt]">
            {data.trackingNumber}
          </span>
          <span className="text-[8px] text-slate-500 mt-0.5 tracking-[2pt]">TRACKING NUMBER</span>
        </div>
      </Page>
    </Document>
  );
}
