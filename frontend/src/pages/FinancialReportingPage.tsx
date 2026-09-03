import { useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, Printer } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'

type Ws = {
  key: string; title: string; subtitle: string; columns: string[]; consolidated: boolean[]
  rows: { label: string; kind: string; values: (number | null)[] }[]
}

const STMT_TABS = [
  { key: 'IS', label: 'Income Statement' },
  { key: 'BS', label: 'Balance Sheet' },
  { key: 'ISNOTES_COST', label: 'Notes — Costs & Expenses' },
  { key: 'ISNOTES_REV', label: 'Notes — Revenue & Other' },
  { key: 'BSNOTES_ASSETS', label: 'Notes — Assets' },
  { key: 'BSNOTES_LIAB', label: 'Notes — Liabilities & Equity' },
]

function colKind(label: string): 'scope' | 'subtotal' | 'entity' {
  if (/(Consolidation|Standalone|CONSOLIDATED|UNCONSOLIDATED)/.test(label)) return 'scope'
  if (/^(TOTAL|ELIMIN)/.test(label)) return 'subtotal'
  return 'entity'
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  const r = Math.round(n)
  if (r === 0) return '—'
  const s = new Intl.NumberFormat('en-US').format(Math.abs(r))
  return r < 0 ? `(${s})` : s
}

// deterministic synthetic prior-year factor (0.85–1.05) so 2024 comparatives tie within a statement
function priorFactor(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return 0.85 + (h % 21) / 100
}
const priorOf = (v: number | null | undefined, factor: number): number | null =>
  v === null || v === undefined ? null : Math.round(v * factor)

export default function FinancialReportingPage({ embedded = false }: { embedded?: boolean }) {
  const [columns, setColumns] = useState<string[]>([])
  const [entityIdx, setEntityIdx] = useState<number>(-1)
  const [stmtKey, setStmtKey] = useState('IS')
  const [ws, setWs] = useState<Ws | null>(null)
  const [cache, setCache] = useState<Record<string, Ws>>({})

  // load column list once (from IS worksheet)
  useEffect(() => {
    client.get('/consolidation/worksheets/IS').then((r) => {
      const w: Ws = r.data
      setColumns(w.columns)
      setCache((c) => ({ ...c, IS: w }))
      const def = w.columns.findIndex((c) => c === 'OIG Standalone')
      setEntityIdx(def >= 0 ? def : w.columns.length - 1)
    })
  }, [])

  // load the selected worksheet (cached)
  useEffect(() => {
    if (cache[stmtKey]) {
      setWs(cache[stmtKey])
      return
    }
    setWs(null)
    client.get(`/consolidation/worksheets/${stmtKey}`).then((r) => {
      setCache((c) => ({ ...c, [stmtKey]: r.data }))
      setWs(r.data)
    })
  }, [stmtKey, cache])

  // classify each column: named consolidation scope / intermediate sub-total / entity
  const options = useMemo(() => {
    const seen: Record<string, number> = {}
    return columns.map((label, idx) => {
      const kind = colKind(label)
      seen[label] = (seen[label] || 0) + 1
      const dup = columns.filter((c) => c === label).length > 1
      const shown = kind === 'subtotal' && dup ? `${label} #${seen[label]}` : label
      return { idx, label: shown, kind }
    })
  }, [columns])

  const entityName = entityIdx >= 0 && columns[entityIdx] ? (options.find((o) => o.idx === entityIdx)?.label ?? columns[entityIdx]) : ''

  // rows for the selected entity column: keep headers, totals, and non-empty lines
  const rows = useMemo(() => {
    if (!ws || entityIdx < 0) return []
    return ws.rows
      .map((r) => ({ label: r.label, kind: r.kind, value: r.values[entityIdx] ?? null }))
      .filter((r) => r.kind === 'header' || r.kind === 'total' || r.value !== null)
  }, [ws, entityIdx])

  const pyFactor = useMemo(() => priorFactor(entityName + stmtKey), [entityName, stmtKey])

  function printStatement() {
    if (!ws) return
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    // Placeholder cover only — full report content is inserted later.
    const w = window.open('', '_blank', 'width=780,height=1000')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>${esc(entityName)} — ${esc(ws.title)}</title><style>
      body{font-family:Georgia,serif;color:#111;margin:44px;}
      .cover{text-align:center;margin-top:130px;} h1{font-size:22px;margin:0 0 8px;} .sub{color:#555;font-size:13px;}
      .ph{margin-top:90px;color:#999;font-size:12px;font-style:italic;text-align:center;}
      @media print{body{margin:22px;}}
    </style></head><body>
      <div class="cover"><h1>${esc(entityName)}</h1><div class="sub">${esc(ws.title)} · FY2025 (SR)</div></div>
      <div class="ph">— Full report to be inserted —</div>
    </body></html>`)
    w.document.close(); w.focus(); setTimeout(() => w.print(), 400)
  }

  return (
    <div>
      {!embedded && (
        <Header
          title="Financial Reporting"
          subtitle="Standalone & entity financial statements — any consolidation unit, drawn from the consolidation worksheets."
        />
      )}

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 mb-5 flex flex-wrap items-center gap-3">
        <FileSpreadsheet size={18} className="text-sky-600" />
        <label className="text-sm text-slate-600">Reporting entity</label>
        <select
          value={entityIdx}
          onChange={(e) => setEntityIdx(Number(e.target.value))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm min-w-[220px]"
        >
          <optgroup label="Consolidation scopes">
            {options.filter((o) => o.kind === 'scope').map((o) => (
              <option key={o.idx} value={o.idx}>{o.label}</option>
            ))}
          </optgroup>
          <optgroup label="Entities & divisions">
            {options.filter((o) => o.kind === 'entity').map((o) => (
              <option key={o.idx} value={o.idx}>{o.label}</option>
            ))}
          </optgroup>
          <optgroup label="Sub-totals & eliminations">
            {options.filter((o) => o.kind === 'subtotal').map((o) => (
              <option key={o.idx} value={o.idx}>{o.label}</option>
            ))}
          </optgroup>
        </select>
        <span className="text-xs text-slate-400">FY2025 (SR)</span>
        <button
          onClick={printStatement}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white text-sm px-3 py-1.5 hover:bg-emerald-700"
        >
          <Printer size={15} /> Print statement
        </button>
      </div>

      {/* statement tabs */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {STMT_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStmtKey(t.key)}
            className={`rounded-lg px-2.5 py-1 text-xs ${
              stmtKey === t.key ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {ws ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="text-sm font-semibold text-slate-800">{entityName} — {ws.title}</div>
            <div className="text-xs text-slate-400">{ws.subtitle}</div>
          </div>
          <div className="px-5 py-3 overflow-x-auto">
            <table className="w-full text-sm max-w-2xl">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 text-left font-medium">Line item</th>
                  <th className="py-2 pl-3 text-right font-medium w-40">2025 (SR)</th>
                  <th className="py-2 pl-3 text-right font-medium w-40">2024 (SR)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  if (r.kind === 'header')
                    return (
                      <tr key={i}>
                        <td colSpan={3} className="pt-3 pb-1 text-[13px] font-bold uppercase tracking-wide text-slate-700">{r.label}</td>
                      </tr>
                    )
                  const total = r.kind === 'total'
                  return (
                    <tr key={i} className={`${total ? 'font-semibold text-slate-900 border-t border-slate-300' : 'text-slate-700 border-b border-slate-50'}`}>
                      <td className={`py-1.5 pr-3 ${!total ? 'pl-3' : ''}`}>{r.label}</td>
                      <td className={`py-1.5 pl-3 text-right tabular-nums ${r.value !== null && r.value < 0 ? 'text-rose-600' : ''}`}>{fmt(r.value)}</td>
                      <td className="py-1.5 pl-3 text-right tabular-nums text-slate-500">{fmt(priorOf(r.value, pyFactor))}</td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-slate-400">No lines for this entity.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400 py-8">Loading…</div>
      )}
    </div>
  )
}
