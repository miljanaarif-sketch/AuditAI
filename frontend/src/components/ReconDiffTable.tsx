import type { ModuleReport } from '../types'
import { formatSAR } from '../utils/format'
import StatusBadge from './StatusBadge'

export default function ReconDiffTable({ reports }: { reports: ModuleReport[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-slate-500 border-b border-slate-200">
          <th className="py-2 pr-4 font-medium">Module</th>
          <th className="py-2 pr-4 font-medium">GL Account</th>
          <th className="py-2 pr-4 font-medium text-right">Module Balance</th>
          <th className="py-2 pr-4 font-medium text-right">GL Balance</th>
          <th className="py-2 pr-4 font-medium text-right">Variance</th>
          <th className="py-2 pr-4 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((r) => (
          <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-2 pr-4 text-slate-800">{r.module}</td>
            <td className="py-2 pr-4 text-slate-500">{r.gl_account_code} · {r.gl_account_name}</td>
            <td className="py-2 pr-4 text-right text-slate-700">{formatSAR(r.module_balance)}</td>
            <td className="py-2 pr-4 text-right text-slate-700">{formatSAR(r.gl_balance)}</td>
            <td className={`py-2 pr-4 text-right font-medium ${r.status === 'flagged' ? 'text-rose-600' : 'text-slate-700'}`}>
              {formatSAR(r.variance)} <span className="text-xs text-slate-400">({r.variance_pct}%)</span>
            </td>
            <td className="py-2 pr-4"><StatusBadge status={r.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
