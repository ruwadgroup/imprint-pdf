export interface KpiData {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  sub: string;
}

export interface MonthData {
  month: string;
  current: number;
  prior: number;
}

export interface ExpenseData {
  category: string;
  amount: number;
  pct: number;
  color: string;
}

export interface TeamMember {
  name: string;
  role: string;
  dept: string;
}

export interface ReportData {
  company: string;
  client: string;
  period: string;
  issuedDate: string;
  kpis: KpiData[];
  revenue: MonthData[];
  expenses: ExpenseData[];
  team: TeamMember[];
  highlights: string[];
  outlook: string;
}

export const report: ReportData = {
  company: 'Imprint Studio LLC',
  client: 'Acme Corporation',
  period: 'January – March 2025',
  issuedDate: 'April 29, 2025',

  kpis: [
    {
      label: 'Total Revenue',
      value: '$1.47M',
      change: '+14.1% YoY',
      positive: true,
      sub: 'vs $1.29M in Q1 2024',
    },
    {
      label: 'Operating Margin',
      value: '31.1%',
      change: '+3.2pp YoY',
      positive: true,
      sub: 'vs 27.9% in Q1 2024',
    },
    {
      label: 'New Contracts',
      value: '47',
      change: '+8 vs prior year',
      positive: true,
      sub: 'incl. 2 enterprise accounts',
    },
    {
      label: 'Net Promoter Score',
      value: '72',
      change: '+5 pts YoY',
      positive: true,
      sub: 'industry avg: 44',
    },
  ],

  // Six-month window: Q4 2024 tail + full Q1 2025
  revenue: [
    { month: 'Oct 2024', current: 398_000, prior: 341_000 },
    { month: 'Nov 2024', current: 421_000, prior: 378_000 },
    { month: 'Dec 2024', current: 387_000, prior: 362_000 },
    { month: 'Jan 2025', current: 442_000, prior: 389_000 },
    { month: 'Feb 2025', current: 481_000, prior: 421_000 },
    { month: 'Mar 2025', current: 551_000, prior: 477_000 },
  ],

  expenses: [
    { category: 'Personnel & Benefits', amount: 469_000, pct: 46, color: '#4f46e5' },
    { category: 'Sales & Marketing', amount: 203_000, pct: 20, color: '#06b6d4' },
    { category: 'Infrastructure & Ops', amount: 132_000, pct: 13, color: '#8b5cf6' },
    { category: 'General & Admin', amount: 112_000, pct: 11, color: '#f59e0b' },
    { category: 'Research & Development', amount: 101_000, pct: 10, color: '#10b981' },
  ],

  team: [
    { name: 'Sarah Chen', role: 'VP of Engineering', dept: 'Engineering' },
    { name: 'Marcus Williams', role: 'Head of Product', dept: 'Product' },
    { name: 'Elena Rodriguez', role: 'Lead Designer', dept: 'Design' },
    { name: 'James Park', role: 'Senior Data Analyst', dept: 'Analytics' },
    { name: 'Priya Sharma', role: 'Customer Success Lead', dept: 'Operations' },
    { name: 'Alex Thompson', role: 'Senior Software Engineer', dept: 'Engineering' },
    { name: 'Nina Kowalski', role: 'Marketing Manager', dept: 'Marketing' },
    { name: 'David Okafor', role: 'Finance Controller', dept: 'Finance' },
  ],

  highlights: [
    'Secured Meridian Health and TechFlow Inc. as enterprise clients — combined projected ARR of $840K.',
    'Shipped the v1.4 rendering engine upgrade, reducing average PDF generation time by 38% and cutting infrastructure costs by $22K per month.',
    'Engineering headcount grew 25% while maintaining a sub-2% production defect rate and 99.97% uptime SLA.',
  ],

  outlook:
    'Q2 2025 pipeline stands at $2.1M with 12 deals in late-stage negotiation. The engineering team will ship v2.0 of the rendering engine in May, with anticipated 40% additional performance improvements. Revenue guidance for Q2 is $1.8–2.0M, supported by a strong enterprise sales motion and planned expansion into the European market.',
};
