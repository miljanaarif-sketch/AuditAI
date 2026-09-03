import { useState } from 'react'
import { Building, Layers } from 'lucide-react'
import Header from '../components/Header'
import FinancialReportingPage from './FinancialReportingPage'
import ConsolidationPage from './ConsolidationPage'

type View = 'bu' | 'consol'

const BOXES: { key: View; title: string; desc: string; icon: typeof Building; accent: string }[] = [
  { key: 'bu', title: 'Individual BU', desc: 'Standalone financial statements & notes for each business unit / entity', icon: Building, accent: 'sky' },
  { key: 'consol', title: 'Consolidation', desc: 'Group consolidated statements, worksheets and full IFRS notes', icon: Layers, accent: 'teal' },
]

export default function Box5ReportingPage() {
  const [view, setView] = useState<View>('bu')

  return (
    <div>
      <Header
        title="5 · Financial Reporting"
        subtitle="Individual business-unit statements and the group consolidation, with full notes."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {BOXES.map(({ key, title, desc, icon: Icon, accent }) => {
          const active = view === key
          const ring = accent === 'sky' ? 'ring-sky-500 border-sky-300' : 'ring-teal-500 border-teal-300'
          const chip = accent === 'sky' ? 'bg-sky-50 text-sky-600' : 'bg-teal-50 text-teal-600'
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`text-left rounded-xl border bg-white p-5 transition hover:shadow-sm ${
                active ? `${ring} ring-2 border-transparent` : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${chip}`}>
                  <Icon size={20} />
                </span>
                <span className="text-base font-semibold text-slate-800">{title}</span>
              </div>
              <p className="text-sm text-slate-500">{desc}</p>
            </button>
          )
        })}
      </div>

      <div className="border-t border-slate-100 pt-6">
        {view === 'bu' ? <FinancialReportingPage embedded /> : <ConsolidationPage embedded />}
      </div>
    </div>
  )
}
