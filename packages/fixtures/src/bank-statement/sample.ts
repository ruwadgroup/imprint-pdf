export interface BankTransaction {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
}

export interface BankStatementData {
  bank: string;
  accountHolder: string;
  accountNumberMasked: string;
  routingNumber: string;
  period: string;
  openingBalance: number;
  transactions: BankTransaction[];
}

export const bankStatementSample: BankStatementData = {
  bank: 'Meridian Federal Bank',
  accountHolder: 'Eleanor R. Whitfield',
  accountNumberMasked: '**** **** **** 7204',
  routingNumber: '021000021',
  period: 'May 1 - May 31, 2026',
  openingBalance: 8420.55,
  transactions: [
    { date: '05/01', description: 'Opening balance carried forward', credit: 0 },
    { date: '05/01', description: 'Direct deposit - Aldridge Consulting LLC', credit: 4250.0 },
    { date: '05/02', description: 'Whole Foods Market #2241', debit: 132.87 },
    { date: '05/02', description: 'Shell Service Station', debit: 58.4 },
    { date: '05/03', description: 'Netflix subscription', debit: 22.99 },
    { date: '05/04', description: 'Transfer to savings ****3318', debit: 800.0 },
    { date: '05/05', description: 'Pacific Gas & Electric - autopay', debit: 184.32 },
    { date: '05/06', description: 'Starbucks #0471', debit: 9.75 },
    { date: '05/07', description: 'Amazon.com order 114-8829', debit: 76.12 },
    { date: '05/08', description: 'Zelle from Marcus Whitfield', credit: 150.0 },
    { date: '05/09', description: 'Trader Joes #118', debit: 64.21 },
    { date: '05/10', description: 'Comcast Xfinity internet', debit: 89.99 },
    { date: '05/11', description: 'Delta Air Lines ticket', debit: 412.6 },
    { date: '05/12', description: 'CVS Pharmacy #4402', debit: 31.48 },
    { date: '05/13', description: 'Interest payment', credit: 3.84 },
    { date: '05/14', description: 'Costco Wholesale #0331', debit: 218.95 },
    { date: '05/15', description: 'Direct deposit - Aldridge Consulting LLC', credit: 4250.0 },
    { date: '05/16', description: 'Spotify Premium', debit: 11.99 },
    { date: '05/17', description: 'Chevron gas station', debit: 61.2 },
    { date: '05/18', description: 'The Cheesecake Factory', debit: 94.5 },
    { date: '05/19', description: 'ATM withdrawal - 5th Ave branch', debit: 200.0 },
    { date: '05/20', description: 'Geico auto insurance', debit: 142.0 },
    { date: '05/21', description: 'Apple Store online', debit: 329.0 },
    { date: '05/22', description: 'Refund - Nordstrom return', credit: 88.4 },
    { date: '05/23', description: 'Safeway #1188', debit: 73.66 },
    { date: '05/24', description: 'Uber trip', debit: 24.3 },
    { date: '05/25', description: 'Verizon Wireless', debit: 95.4 },
    { date: '05/26', description: 'Home Depot #6622', debit: 156.78 },
    { date: '05/27', description: 'Zelle to Priya Nair', debit: 75.0 },
    { date: '05/28', description: 'Whole Foods Market #2241', debit: 118.04 },
    { date: '05/29', description: 'Monthly mortgage - Meridian Home Loans', debit: 1875.0 },
    { date: '05/30', description: 'Dividend - Vanguard brokerage', credit: 212.55 },
    { date: '05/31', description: 'Account maintenance fee', debit: 12.0 },
  ],
};
