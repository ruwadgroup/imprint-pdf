export interface ReportKpi {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

export interface ReportMonth {
  month: string;
  value: number;
}

export interface ReportLineItem {
  account: string;
  category: string;
  budget: number;
  actual: number;
}

export interface ReportData {
  company: string;
  title: string;
  period: string;
  preparedFor: string;
  kpis: ReportKpi[];
  revenueByMonth: ReportMonth[];
  lineItems: ReportLineItem[];
}

export const reportSample: ReportData = {
  company: 'Helios Manufacturing',
  title: 'Q2 2026 Financial Report',
  period: 'April 1 - June 30, 2026',
  preparedFor: 'Board of Directors',
  kpis: [
    { label: 'Total revenue', value: '$18.42M', delta: '+12.4%', up: true },
    { label: 'Gross margin', value: '41.8%', delta: '+2.1pt', up: true },
    { label: 'Operating income', value: '$4.16M', delta: '+8.7%', up: true },
    { label: 'Net cash flow', value: '$2.93M', delta: '-3.2%', up: false },
  ],
  revenueByMonth: [
    { month: 'Jan', value: 5.21 },
    { month: 'Feb', value: 5.48 },
    { month: 'Mar', value: 5.93 },
    { month: 'Apr', value: 6.02 },
    { month: 'May', value: 6.14 },
    { month: 'Jun', value: 6.26 },
  ],
  lineItems: [
    {
      account: '4000',
      category: 'Product revenue - North America',
      budget: 4200000,
      actual: 4418500,
    },
    { account: '4010', category: 'Product revenue - EMEA', budget: 3100000, actual: 2987400 },
    { account: '4020', category: 'Product revenue - APAC', budget: 2400000, actual: 2641900 },
    { account: '4100', category: 'Service & support contracts', budget: 1850000, actual: 1922300 },
    { account: '4200', category: 'Licensing & royalties', budget: 640000, actual: 705100 },
    { account: '4300', category: 'Spare parts & accessories', budget: 520000, actual: 498700 },
    {
      account: '5000',
      category: 'Cost of goods - raw materials',
      budget: 3850000,
      actual: 3962100,
    },
    { account: '5010', category: 'Cost of goods - direct labor', budget: 2100000, actual: 2044800 },
    { account: '5020', category: 'Manufacturing overhead', budget: 1420000, actual: 1487600 },
    { account: '5030', category: 'Freight & logistics inbound', budget: 380000, actual: 401200 },
    { account: '5100', category: 'Warehousing & fulfillment', budget: 295000, actual: 288400 },
    { account: '6000', category: 'Sales salaries & commissions', budget: 1240000, actual: 1318900 },
    { account: '6010', category: 'Marketing & demand generation', budget: 860000, actual: 912500 },
    { account: '6020', category: 'Trade shows & events', budget: 210000, actual: 187300 },
    { account: '6100', category: 'Research & development', budget: 1680000, actual: 1742000 },
    {
      account: '6110',
      category: 'Engineering tooling & prototypes',
      budget: 340000,
      actual: 366800,
    },
    { account: '6200', category: 'General & administrative', budget: 720000, actual: 698200 },
    { account: '6210', category: 'Executive compensation', budget: 540000, actual: 540000 },
    { account: '6220', category: 'Legal & professional fees', budget: 280000, actual: 324600 },
    { account: '6230', category: 'Insurance & risk management', budget: 195000, actual: 201400 },
    { account: '6300', category: 'Facilities & utilities', budget: 410000, actual: 428900 },
    { account: '6310', category: 'Equipment depreciation', budget: 620000, actual: 620000 },
    { account: '6320', category: 'Software & IT infrastructure', budget: 385000, actual: 412700 },
    { account: '6400', category: 'Training & development', budget: 145000, actual: 132800 },
    { account: '6500', category: 'Travel & entertainment', budget: 230000, actual: 248100 },
    { account: '7000', category: 'Interest expense', budget: 165000, actual: 158300 },
    { account: '7100', category: 'Foreign exchange loss', budget: 0, actual: 42900 },
    { account: '7200', category: 'Other income', budget: 90000, actual: 118400 },
    { account: '8000', category: 'Income tax provision', budget: 880000, actual: 904600 },
    { account: '8100', category: 'Deferred tax adjustment', budget: 0, actual: -36200 },
  ],
};
