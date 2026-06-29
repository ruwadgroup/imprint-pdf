export interface Address {
  name: string;
  line1: string;
  line2?: string;
  cityStateZip: string;
  country: string;
}

export interface ShippingLabelData {
  carrier: string;
  service: string;
  weight: string;
  shipDate: string;
  trackingNumber: string;
  from: Address;
  to: Address;
}

export const shippingLabelSample: ShippingLabelData = {
  carrier: 'IMPRINT EXPRESS',
  service: 'PRIORITY 2-DAY',
  weight: '3 lb 6 oz',
  shipDate: '2026-06-29',
  trackingNumber: '1Z 994 8KX 02 8451 2207',
  from: {
    name: 'Northwind Studio',
    line1: '512 Industrial Parkway',
    line2: 'Suite 40',
    cityStateZip: 'Portland, OR 97209',
    country: 'USA',
  },
  to: {
    name: 'Acme Corporation',
    line1: '500 Market Street',
    line2: 'Receiving Dock B',
    cityStateZip: 'San Francisco, CA 94105',
    country: 'USA',
  },
};
