export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptData {
  merchant: string;
  address: string;
  phone: string;
  receiptNo: string;
  date: string;
  cashier: string;
  items: ReceiptItem[];
  taxRate: number;
  paymentMethod: string;
  barcodeValue: string;
}

export const receiptSample: ReceiptData = {
  merchant: 'Cedar & Sage Market',
  address: '128 Birchwood Ave, Portland, OR 97204',
  phone: '(503) 555-0147',
  receiptNo: 'R-880421',
  date: '2026-06-29 14:32',
  cashier: 'Maya',
  items: [
    { name: 'Sourdough loaf', qty: 1, price: 6.5 },
    { name: 'Cold brew coffee', qty: 2, price: 4.25 },
    { name: 'Farm eggs (dozen)', qty: 1, price: 7.0 },
    { name: 'Aged cheddar 8oz', qty: 1, price: 9.75 },
    { name: 'Honey jar', qty: 3, price: 5.5 },
  ],
  taxRate: 0.0,
  paymentMethod: 'Visa •••• 4291',
  barcodeValue: 'R8804212026062914',
};
