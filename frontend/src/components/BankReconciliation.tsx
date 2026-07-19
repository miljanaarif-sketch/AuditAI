import { Fragment, useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, ChevronRight, ChevronUp } from 'lucide-react'
import client from '../api/client'
import { formatSAR } from '../utils/format'
import type { BankReconciliation } from '../types'

export default function BankReconciliationPanel() {
  const [recons, setRecons] = useState<BankReconciliation[]>([])
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    client.get('/box4/bank-reconciliation').then((res) => setRecons(res.data))
  }, [])

  if (recons.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
      <h2 className="text-sm font-semibold text-slate-800 mb-4">Bank Reconciliation</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-4 font-medium">Bank</th>
            <th className="py-2 pr-4 font-medium">Account</th>
            <th className="py-2 pr-4 font-medium text-right">Balance per Books</th>
            <th className="py-2 pr-4 font-medium text-right">Balance per Bank</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium text-right">Reconciliation</th>
          </tr>
        </thead>
        <tbody>
          {recons.map((r) => {
            const reconciled = Math.abs(r.difference) < 0.5
            const isOpen = openId === r.id
            return (
              <Fragment key={r.id}>
                <tr
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{r.bank}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.account}</td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">{formatSAR(r.book_balance)}</td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">{formatSAR(r.bank_statement_balance)}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        reconciled ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {reconciled ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {reconciled ? 'Reconciled' : formatSAR(r.difference)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-sky-700">
                      {isOpen ? (
                        <>
                          Hide <ChevronUp size={13} />
                        </>
                      ) : (
                        <>
                          View recon <ChevronRight size={13} />
                        </>
                      )}
                    </span>
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={6} className="bg-slate-50 px-4 py-4">
                      <div className="max-w-md">
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b border-slate-100">
                              <td className="py-1.5 text-slate-600">Balance per books (GL)</td>
                              <td className="py-1.5 text-right text-slate-800">{formatSAR(r.book_balance)}</td>
                            </tr>
                            {r.items.map((it, i) => (
                              <tr key={i} className="border-b border-slate-100">
                                <td className="py-1.5 pl-3 text-slate-500">{it.label}</td>
                                <td className={`py-1.5 text-right ${it.amount < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                                  {formatSAR(it.amount)}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-b border-slate-200">
                              <td className="py-1.5 font-medium text-slate-700">Adjusted book balance</td>
                              <td className="py-1.5 text-right font-medium text-slate-900">
                                {formatSAR(r.adjusted_book_balance)}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5 text-slate-600">Balance per bank statement</td>
                              <td className="py-1.5 text-right text-slate-800">{formatSAR(r.bank_statement_balance)}</td>
                            </tr>
                          </tbody>
                        </table>
                        <div
                          className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
                            Math.abs(r.difference) < 0.5 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {Math.abs(r.difference) < 0.5 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                          {Math.abs(r.difference) < 0.5
                            ? 'Reconciled — nil difference'
                            : `Unreconciled difference: ${formatSAR(r.difference)}`}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
