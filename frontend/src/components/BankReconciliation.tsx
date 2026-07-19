import { useEffect, useState } from 'react'
import { Landmark, CheckCircle2, AlertTriangle } from 'lucide-react'
import client from '../api/client'
import { formatSAR } from '../utils/format'
import type { BankReconciliation } from '../types'

export default function BankReconciliationPanel() {
  const [recons, setRecons] = useState<BankReconciliation[]>([])

  useEffect(() => {
    client.get('/box4/bank-reconciliation').then((res) => setRecons(res.data))
  }, [])

  if (recons.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
      <h2 className="text-sm font-semibold text-slate-800 mb-4">Bank Reconciliation</h2>
      <div className="grid grid-cols-2 gap-4">
        {recons.map((r) => {
          const reconciled = Math.abs(r.difference) < 0.5
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Landmark size={16} className="text-emerald-600" />
                <div>
                  <div className="text-sm font-semibold text-slate-800">{r.bank}</div>
                  <div className="text-xs text-slate-400">{r.account}</div>
                </div>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-600">Balance per books (GL)</td>
                    <td className="py-1.5 text-right text-slate-800">{formatSAR(r.book_balance)}</td>
                  </tr>
                  {r.items.map((it, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1.5 pl-3 text-slate-500">{it.label}</td>
                      <td className={`py-1.5 text-right ${it.amount < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {formatSAR(it.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 font-medium text-slate-700">Adjusted book balance</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">{formatSAR(r.adjusted_book_balance)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-600">Balance per bank statement</td>
                    <td className="py-1.5 text-right text-slate-800">{formatSAR(r.bank_statement_balance)}</td>
                  </tr>
                </tbody>
              </table>
              <div
                className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
                  reconciled ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {reconciled ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {reconciled
                  ? 'Reconciled — nil difference'
                  : `Unreconciled difference: ${formatSAR(r.difference)}`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
