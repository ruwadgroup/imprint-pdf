import {
  Document,
  Footer,
  Header,
  Page,
  PageNumber,
  TotalPages,
} from '@imprint-pdf/react/standalone';
import { Table, Td, Th, Tr } from '../components/Table.js';
import { money, sumBy } from '../lib/format.js';
import type { BankStatementData } from './sample.js';

export type { BankStatementData, BankTransaction } from './sample.js';
export { bankStatementSample } from './sample.js';

export interface BankStatementProps {
  data: BankStatementData;
}

export function BankStatement({ data }: BankStatementProps) {
  const totalCredits = sumBy(data.transactions, (t) => t.credit ?? 0);
  const totalDebits = sumBy(data.transactions, (t) => t.debit ?? 0);
  const closingBalance = data.openingBalance + totalCredits - totalDebits;

  let running = data.openingBalance;
  const rows = data.transactions.map((t) => {
    running = running + (t.credit ?? 0) - (t.debit ?? 0);
    return { ...t, balance: running };
  });

  return (
    <Document
      title={`Statement ${data.period}`}
      author={data.bank}
      subject="Monthly bank statement"
    >
      <Page size="A4" className="bg-white px-12 py-10 font-sans text-slate-900">
        <Header>
          <div className="flex flex-row justify-between items-center border-b border-slate-200 pb-3 mb-6">
            <span className="text-sm font-bold text-sky-800">{data.bank}</span>
            <span className="text-xs text-slate-400">Statement period {data.period}</span>
          </div>
        </Header>

        <Footer>
          <div className="flex flex-row justify-between items-center border-t border-slate-200 pt-3 mt-6">
            <span className="text-[8pt] text-slate-400">{data.accountNumberMasked}</span>
            <span className="text-[8pt] text-slate-400">
              Page <PageNumber /> of <TotalPages />
            </span>
          </div>
        </Footer>

        <div className="flex flex-row justify-between items-start mb-8">
          <div className="flex flex-col">
            <span className="text-[9pt] text-slate-400 tracking-[1pt]">ACCOUNT HOLDER</span>
            <p className="text-base font-bold text-slate-900 mt-1">{data.accountHolder}</p>
            <p className="text-xs text-slate-500 mt-1">Account {data.accountNumberMasked}</p>
            <p className="text-xs text-slate-500 mt-0.5">Routing {data.routingNumber}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9pt] text-slate-400 tracking-[1pt]">STATEMENT PERIOD</span>
            <p className="text-sm font-semibold text-slate-900 mt-1">{data.period}</p>
          </div>
        </div>

        <div className="flex flex-row justify-between mb-10">
          <div className="flex flex-col flex-1 bg-slate-50 rounded-lg px-4 py-3 mr-3">
            <span className="text-[9pt] text-slate-500">Opening balance</span>
            <span className="text-lg font-bold text-slate-900 mt-1">
              {money(data.openingBalance)}
            </span>
          </div>
          <div className="flex flex-col flex-1 bg-emerald-50 rounded-lg px-4 py-3 mr-3">
            <span className="text-[9pt] text-emerald-700">Total deposits</span>
            <span className="text-lg font-bold text-emerald-700 mt-1">{money(totalCredits)}</span>
          </div>
          <div className="flex flex-col flex-1 bg-rose-50 rounded-lg px-4 py-3 mr-3">
            <span className="text-[9pt] text-rose-700">Total withdrawals</span>
            <span className="text-lg font-bold text-rose-700 mt-1">{money(totalDebits)}</span>
          </div>
          <div className="flex flex-col flex-1 bg-sky-800 rounded-lg px-4 py-3">
            <span className="text-[9pt] text-sky-100">Closing balance</span>
            <span className="text-lg font-bold text-white mt-1">{money(closingBalance)}</span>
          </div>
        </div>

        <Table>
          <Tr className="bg-sky-800 rounded-t px-4">
            <Th width={56}>Date</Th>
            <Th flex>Description</Th>
            <Th align="right" width={84}>
              Debit
            </Th>
            <Th align="right" width={84}>
              Credit
            </Th>
            <Th align="right" width={96}>
              Balance
            </Th>
          </Tr>
          {rows.map((t, i) => (
            <Tr key={i} className={`px-4 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
              <Td width={56}>{t.date}</Td>
              <Td flex>{t.description}</Td>
              <Td align="right" width={84}>
                {t.debit ? (
                  <span className="text-xs text-right text-rose-600">{money(t.debit)}</span>
                ) : (
                  <span className="text-xs text-right text-slate-300">-</span>
                )}
              </Td>
              <Td align="right" width={84}>
                {t.credit ? (
                  <span className="text-xs text-right text-emerald-600">{money(t.credit)}</span>
                ) : (
                  <span className="text-xs text-right text-slate-300">-</span>
                )}
              </Td>
              <Td align="right" width={96}>
                <span className="text-xs text-right font-semibold text-slate-900">
                  {money(t.balance)}
                </span>
              </Td>
            </Tr>
          ))}
        </Table>
      </Page>
    </Document>
  );
}
