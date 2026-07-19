import { Construction } from 'lucide-react'
import Header from '../components/Header'
import BoxRequirements from '../components/BoxRequirements'

export default function Box3LedgerPage() {
  return (
    <div>
      <Header
        title="3 · General Ledger"
        subtitle="Trial balance drills to account, to journal, to the underlying source document."
      />

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 flex items-start gap-4">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 text-amber-500 shrink-0">
          <Construction size={22} />
        </span>
        <div>
          <div className="text-sm font-semibold text-slate-800 mb-1">GL drill-down engine — to be developed</div>
          <p className="text-sm text-slate-500">
            The live GL (trial balance → journal → source document, JE testing) will connect to the NAWRAS ERP.
            The required GL reports are tracked in the folders below.
          </p>
        </div>
      </div>

      <BoxRequirements box="box3" title="Required GL Reports" />
    </div>
  )
}
