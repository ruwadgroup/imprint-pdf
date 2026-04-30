export interface OrderItem {
  name: string;
  sku: string;
  qty: number;
  price: number;
}

export interface SalesOrderData {
  invoiceNumber: string;
  orderNumber: string;
  orderDate: string;
  customer: {
    name: string;
    address: string;
    shippingMethod: string;
    paymentMethod: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: { code: string; description: string; amount: number };
  tax: number;
  shipping: number;
  total: number;
  store: { name: string; address: string };
}

export const salesOrder: SalesOrderData = {
  invoiceNumber: '#9000000001',
  orderNumber: '#9000000001',
  orderDate: 'Dec 11, 2020, 10:56:14 AM',
  customer: {
    name: 'Veronica Costello',
    address:
      'Veronica Costello\n6146 Honey Bluff Parkway\nCalder, Michigan, 49628-7978\nUnited States\nT: (555) 229-3326',
    shippingMethod: 'Flat Rate - Fixed',
    paymentMethod: 'Check / Money order',
  },
  items: [
    { name: 'Endurance Watch', sku: '24-MG01', qty: 1, price: 49.0 },
    { name: 'Fusion Backpack', sku: '24-MB02', qty: 1, price: 50.0 },
    { name: 'Affirm Water Bottle', sku: '24-UG06', qty: 1, price: 7.0 },
    { name: 'Pursuit Lumaflex Tone Band', sku: '24-UG02', qty: 1, price: 16.0 },
    { name: "Go-Get'r Pushup Grips", sku: '24-UG05', qty: 1, price: 19.0 },
  ],
  subtotal: 141.0,
  discount: {
    code: 'EYHPAOMMT9O9FXDH',
    description: 'FREE SHIPPING ON ANY PURCHASE OVER $50',
    amount: -14.1,
  },
  tax: 10.47,
  shipping: 25.0,
  total: 162.37,
  store: {
    name: 'StripesShop',
    address: '6146 Honey Bluff Parkway\nCalder, Michigan, 49628-7978\nUnited States',
  },
};
