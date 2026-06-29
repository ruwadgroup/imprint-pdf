export interface BoardingPassData {
  airline: string;
  flight: string;
  class: string;
  passenger: string;
  from: { code: string; city: string };
  to: { code: string; city: string };
  date: string;
  boarding: string;
  departure: string;
  gate: string;
  seat: string;
  group: string;
  sequence: string;
  barcodeValue: string;
}

export const boardingPassSample: BoardingPassData = {
  airline: 'Meridian Air',
  flight: 'MA 482',
  class: 'Economy',
  passenger: 'OKONKWO / MARA',
  from: { code: 'SFO', city: 'San Francisco' },
  to: { code: 'JFK', city: 'New York' },
  date: '29 JUN 2026',
  boarding: '08:15',
  departure: '08:45',
  gate: 'D24',
  seat: '14C',
  group: '3',
  sequence: '047',
  barcodeValue: 'MA482SFOJFK29JUN14C047OKONKWOMARA',
};
