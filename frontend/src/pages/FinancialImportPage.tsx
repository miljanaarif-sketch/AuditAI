import { useEffect, useMemo, useState } from 'react'
import { Globe, ArrowRight, Upload } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'

type Ws = {
  key: string; title: string; columns: string[]
  rows: { label: string; kind: string; values: (number | null)[] }[]
}

// Non-NAWRAS foreign entities — financials imported in base currency, translated to SAR.
// avg = average rate (Income Statement), close = closing rate (Balance Sheet). Indicative — replace with actuals.
const ENTITIES = [
  { key: 'OMDF', name: 'MDF Spain', cur: 'EUR', symbol: '€', avg: 4.0, close: 4.05 },
  { key: 'Egypt OIG', name: 'Egypt', cur: 'EGP', symbol: 'E£', avg: 0.078, close: 0.076 },
  { key: 'O3 Smart', name: 'O3', cur: 'USD', symbol: '$', avg: 3.75, close: 3.75 },
  { key: 'KSA Services', name: 'KSA Service', cur: 'CHF', symbol: 'Fr', avg: 4.15, close: 4.2 },
]

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  const r = Math.round(n)
  if (r === 0) return '—'
  const s = new Intl.NumberFormat('en-US').format(Math.abs(r))
  return r < 0 ? `(${s})` : s
}

function StmtTable({ ws, col, rate, curLabel, rateLabel }: { ws: Ws | null; col: number; rate: number; curLabel: string; rateLabel: string }) {
  if (!ws || col < 0) return null
  const rows = ws.rows
    .map((r) => ({ label: r.label, kind: r.kind, sar: r.values[col] ?? null }))
    .filter((r) => r.kind === 'header' || r.kind === 'total' || r.sar !== null)
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-5">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">{ws.title}</div>
        <div className="text-xs text-slate-500">{rateLabel}: 1 {curLabel} = {rate} SAR</div>
      </div>
      <div className="px-5 py-3 overflow-x-auto">
        <table className="w-full text-sm max-w-3xl">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-3 text-left font-medium">Line item</th>
              <th className="py-2 pl-3 text-right font-medium w-40">Base ({curLabel})</th>
              <th className="py-2 pl-3 text-right font-medium w-8 text-slate-300"></th>
              <th className="py-2 pl-3 text-right font-medium w-40">Translated (SAR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              if (r.kind === 'header')
                return (
                  <tr key={i}>
                    <td colSpan={4} className="pt-3 pb-1 text-[13px] font-bold uppercase tracking-wide text-slate-700">{r.label}</td>
                  </tr>
                )
              const total = r.kind === 'total'
              const base = r.sar === null ? null : r.sar / rate
              return (
                <tr key={i} className={`${total ? 'font-semibold text-slate-900 border-t border-slate-300' : 'text-slate-700 border-b border-slate-50'}`}>
                  <td className={`py-1.5 pr-3 ${!total ? 'pl-3' : ''}`}>{r.label}</td>
                  <td className="py-1.5 pl-3 text-right tabular-nums text-slate-600">{fmt(base)}</td>
                  <td className="py-1.5 text-center text-slate-300"><ArrowRight size={12} className="inline" /></td>
                  <td className={`py-1.5 pl-3 text-right tabular-nums ${r.sar !== null && r.sar < 0 ? 'text-rose-600' : ''}`}>{fmt(r.sar)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function FinancialImportPage() {
  const [isWs, setIsWs] = useState<Ws | null>(null)
  const [bsWs, setBsWs] = useState<Ws | null>(null)
  const [entKey, setEntKey] = useState('OMDF')

  useEffect(() => {
    client.get('/consolidation/worksheets/IS').then((r) => setIsWs(r.data))
    client.get('/consolidation/worksheets/BS').then((r) => setBsWs(r.data))
  }, [])

  const ent = ENTITIES.find((e) => e.key === entKey)!
  const col = useMemo(() => (isWs ? isWs.columns.indexOf(entKey) : -1), [isWs, entKey])

  return (
    <div>
      <Header
        title="Financial Import"
        subtitle="Non-NAWRAS entities — financials imported in base currency and translated to SAR, then fed into the consolidation."
      />

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-5 py-3 mb-5 text-sm text-emerald-900 flex items-center gap-2">
        <Upload size={16} className="text-emerald-600" />
        These four entities do not report through the NAWRAS ERP. Their statements are imported in local currency and translated —
        <span className="font-semibold">average rate for the Income Statement, closing rate for the Balance Sheet</span> — then connect to the OIG Consolidation.
      </div>

      {/* entity drill-down */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Globe size={16} className="text-slate-500" />
        {ENTITIES.map((e) => (
          <button
            key={e.key}
            onClick={() => setEntKey(e.key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              entKey === e.key ? 'brand-grad brand-ring text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'
            }`}
          >
            {e.name} <span className="opacity-70">· {e.cur}</span>
          </button>
        ))}
      </div>

      <div className="text-sm text-slate-600 mb-3">
        <span className="font-semibold text-slate-800">{ent.name}</span> — base currency <span className="font-semibold">{ent.cur} ({ent.symbol})</span> ·
        average rate {ent.avg} · closing rate {ent.close} <span className="text-xs text-slate-400">(indicative — replace with actuals)</span>
      </div>

      <StmtTable ws={isWs} col={col} rate={ent.avg} curLabel={ent.cur} rateLabel="Average rate (IS)" />
      <StmtTable ws={bsWs} col={col} rate={ent.close} curLabel={ent.cur} rateLabel="Closing rate (BS)" />

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 flex items-center gap-2">
        <ArrowRight size={15} className="text-emerald-600" />
        The translated SAR column feeds directly into <span className="font-semibold text-slate-700">Consolidation → OIG Consolidation</span> as this entity's column.
      </div>
    </div>
  )
}
