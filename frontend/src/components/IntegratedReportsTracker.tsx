import { useEffect, useState } from 'react'
import { GitCompareArrows } from 'lucide-react'
import client from '../api/client'

type Item = {
  sno: string; num: string; level: number; name: string
  oig: string; oic: string; dv: string; overall: string; covered: string | null
}

const OVERALL_BADGE: Record<string, string> = {
  Ready: 'bg-emerald-100 text-emerald-700',
  Blocked: 'bg-rose-100 text-rose-700',
  'N/A': 'bg-slate-100 text-slate-500',
  Future: 'bg-amber-100 text-amber-700',
  Query: 'bg-sky-100 text-sky-700',
}
const statusColor = (v: string) =>
  !v ? 'text-emerald-600' : /not available|incorrect|hold|not matching/i.test(v) ? 'text-rose-600' : /future|confirm/i.test(v) ? 'text-amber-600' : 'text-slate-400'
const statusText = (v: string) => (v ? v : '✓ ready')

const CATS: [string, RegExp][] = [
  ['Employee Cost', /emp |emp\.|payroll|employee|vacation|ticket|end of service/i],
  ['VAT & Tax', /vat|zakat|tax|e-invoice|wht/i],
  ['Inventory', /inventor|item movement/i],
  ['Fixed Assets', /fixed asset|fa movement|negative fixed|asset movement/i],
  ['Receivables & Payables', /aging|receivable|payable|customer|supplier|advance|soa|statement of account|sales by|purchase analysis|ecl|invoice/i],
  ['Reconciliations & Controls', /recon|exceptional|control/i],
  ['Movements, GL & Other', /.*/],
]
function categorize(name: string): string {
  for (const [cat, re] of CATS) if (re.test(name)) return cat
  return 'Movements, GL & Other'
}

export default function IntegratedReportsTracker() {
  const [items, setItems] = useState<Item[]>([])
  const [open, setOpen] = useState(true)

  useEffect(() => {
    client.get('/tracker/items').then((r) => setItems(r.data.filter((i: Item) => i.covered === 'Box 4')))
  }, [])

  if (!items.length) return null
  const ready = items.filter((i) => i.overall === 'Ready').length
  const blocked = items.filter((i) => i.overall === 'Blocked').length
  const cats = CATS.map(([c]) => c).filter((c) => items.some((i) => categorize(i.name) === c))

  return (
    <div className="rounded-xl border border-slate-200 bg-white mt-6 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600">
            <GitCompareArrows size={18} />
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-800">Integrated Reports & Reconciliations — readiness</div>
            <div className="text-xs text-slate-400">{items.length} reports from the Audit Tracker · {ready} ready · {blocked} blocked</div>
          </div>
        </div>
        <span className="text-xs text-slate-400">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-3 space-y-5">
          {cats.map((cat) => {
            const rows = items.filter((i) => categorize(i.name) === cat)
            return (
              <div key={cat}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  {cat} <span className="text-slate-300">· {rows.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-2 font-medium w-10">#</th>
                        <th className="py-2 pr-4 font-medium">Report</th>
                        <th className="py-2 pr-4 font-medium w-36">OIG Consol</th>
                        <th className="py-2 pr-4 font-medium w-36">OIC Consol</th>
                        <th className="py-2 pr-4 font-medium w-36">Data Validation</th>
                        <th className="py-2 pr-4 font-medium w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((i) => (
                        <tr key={i.sno} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 pr-2 text-slate-400 tabular-nums">{i.num}</td>
                          <td className="py-2 pr-4 text-slate-800">{i.name}</td>
                          <td className={`py-2 pr-4 text-xs ${statusColor(i.oig)}`}>{statusText(i.oig)}</td>
                          <td className={`py-2 pr-4 text-xs ${statusColor(i.oic)}`}>{statusText(i.oic)}</td>
                          <td className={`py-2 pr-4 text-xs ${statusColor(i.dv)}`}>{statusText(i.dv)}</td>
                          <td className="py-2 pr-4">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${OVERALL_BADGE[i.overall] || 'bg-slate-100'}`}>{i.overall}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
