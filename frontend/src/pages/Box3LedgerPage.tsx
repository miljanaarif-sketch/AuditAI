import { Construction, PlugZap, ListChecks } from 'lucide-react'
import Header from '../components/Header'

function EngineCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 flex items-start gap-4">
      <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 text-amber-500 shrink-0">
        <Construction size={22} />
      </span>
      <div>
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <span className="text-sm font-semibold text-slate-800">{title} — to be developed</span>
          <span className="flex items-center gap-1 rounded-full border border-teal-300 bg-teal-50 text-teal-700 text-[11px] px-2 py-0.5">
            <PlugZap size={11} /> via NAWRAS API
          </span>
        </div>
        <p className="text-sm text-slate-500">{body}</p>
      </div>
    </div>
  )
}

const INSTRUCTIONS = [
  {
    title: 'Revenue drill-down',
    text: 'From any revenue figure, drill down to the underlying source set — sales order, GDN / delivery note, customer-acknowledged delivery challan and commercial invoice — pulled directly through the API.',
  },
  {
    title: 'Income-statement drill-down',
    text: 'Every income-statement line traces down to its supporting schedules, the general ledger and the source documents behind it, pulled directly through the API.',
  },
  {
    title: 'Balance-sheet drill-down',
    text: 'Every balance-sheet line traces down to its account, the movement schedule behind it and the supporting evidence — source documents and third-party confirmations — pulled directly through the API.',
  },
]

export default function Box3LedgerPage() {
  return (
    <div>
      <Header
        title="3 · General Ledger"
        subtitle="Trial balance drills to account, to journal, to the underlying source document."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <EngineCard
          title="GL Dump engine"
          body="The full general-ledger dump loads first — every account balance for the year, tying to the trial balance — then drills account → journal → source document, fed directly from the NAWRAS ERP."
        />
        <EngineCard
          title="JE Dump engine"
          body="The complete journal-entry dump loads with the full population of entries — manual vs system, approvals and segregation of duties, cut-off and period controls — for journal-entry testing, fed directly from the NAWRAS ERP."
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600">
            <ListChecks size={16} />
          </span>
          <h2 className="text-sm font-semibold text-slate-800">Drill-down instructions</h2>
        </div>
        <div className="space-y-3">
          {INSTRUCTIONS.map((i) => (
            <div key={i.title} className="border-l-2 border-slate-100 pl-3">
              <div className="text-sm font-medium text-slate-800">{i.title}</div>
              <div className="text-sm text-slate-500">{i.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
