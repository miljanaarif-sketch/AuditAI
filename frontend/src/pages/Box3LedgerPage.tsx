import { Construction, PlugZap } from 'lucide-react'
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800">GL drill-down engine — to be developed</span>
            <span className="flex items-center gap-1 rounded-full border border-teal-300 bg-teal-50 text-teal-700 text-[11px] px-2 py-0.5">
              <PlugZap size={11} /> via NAWRAS API
            </span>
          </div>
          <p className="text-sm text-slate-500">
            GL Dump and journal-entry history load first, then the live trial balance → journal → source document
            drill-down (JE testing) — all fed directly from the NAWRAS ERP. Revenue and Income-Statement drill-downs
            are footnotes off the GL. The required GL reports are tracked in the folders below.
          </p>
        </div>
      </div>

      <BoxRequirements box="box3" title="Required GL Reports" />
    </div>
  )
}
