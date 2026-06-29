export interface EventTicketData {
  brand: string;
  eventName: string;
  subtitle: string;
  date: string;
  doors: string;
  venue: string;
  venueAddress: string;
  section: string;
  row: string;
  seat: string;
  gate: string;
  ticketId: string;
  qrValue: string;
}

export const eventTicketSample: EventTicketData = {
  brand: 'LUMEN LIVE',
  eventName: 'Aurora Nights Festival',
  subtitle: 'Main Stage · An evening of orchestral electronica',
  date: 'Sat, Aug 15 2026 · 8:00 PM',
  doors: '6:30 PM',
  venue: 'Harborfront Amphitheater',
  venueAddress: 'Pier 9, Seattle, WA',
  section: 'GA-2',
  row: 'F',
  seat: '114',
  gate: 'C',
  ticketId: 'TKT-2026-AN-08841',
  qrValue: 'TKT-2026-AN-08841|GA2|F|114',
};
