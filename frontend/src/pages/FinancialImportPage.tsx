import { useEffect, useMemo, useState } from 'react'
import { Globe, ArrowRight, Upload, Save, Check } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'

type Ws = {
  key: string; title: string; columns: string[]
  rows: { label: string; kind: string; values: (number | null)[] }[]
}
type Rate = { name: string; entity: string; avg: number; closing: number }
type Rates = Record<string, Rate>

// entity → worksheet column + base currency (rates come from the editable control table)
const ENTITIES = [
  { key: 'OMDF', name: 'MDF Spain', cur: 'EUR', symbol: '€' },
  { key: 'Egypt OIG', name: 'Egypt', cur: 'EGP', symbol: 'E£' },
  { key: 'O3 Smart', name: 'O3', cur: 'USD', symbol: '$' },
  { key: 'KSA Services', name: 'KSA Service', cur: 'CHF', symbol: 'Fr' },
]

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  const r = Math.round(n)
  if (r === 0) return '—'
  const s = new Intl.NumberFormat('en-US').format(Math.abs(r))
  return r < 0 ? `(${s})` : s
}

function StmtTable({ ws, col, rate, cur, rateLabel }: { ws: Ws | null; col: number; rate: number; cur: string; rateLabel: string }) {
  if (!ws || col < 0) return null
  const rows = ws.rows
    .map((r) => ({ label: r.label, kind: r.kind, sar: r.values[col] ?? null }))
    .filter((r) => r.kind === 'header' || r.kind === 'total' || r.sar !== null)
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-5">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">{ws.title}</div>
        <div className="text-xs text-slate-500">{rateLabel}: 1 {cur} = {rate || '—'} SAR</div>
      </div>
      <div className="px-5 py-3 overflow-x-auto">
        <table className="w-full text-sm max-w-3xl">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-3 text-left font-medium">Line item</th>
              <th className="py-2 pl-3 text-right font-medium w-40">Base ({cur})</th>
              <th className="py-2 w-8"></th>
              <th className="py-2 pl-3 text-right font-medium w-40">Translated (SAR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              if (r.kind === 'header')
                return (
                  <tr key={i}><td colSpan={4} className="pt-3 pb-1 text-[13px] font-bold uppercase tracking-wide text-slate-700">{r.label}</td></tr>
                )
              const total = r.kind === 'total'
              const base = r.sar === null || !rate ? null : r.sar / rate
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
  const [rates, setRates] = useState<Rates>({})
  const [draft, setDraft] = useState<Rates>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    client.get('/consolidation/worksheets/IS').then((r) => setIsWs(r.data))
    client.get('/consolidation/worksheets/BS').then((r) => setBsWs(r.data))
    client.get('/consolidation/fx-rates').then((r) => { setRates(r.data); setDraft(r.data) })
  }, [])

  const ent = ENTITIES.find((e) => e.key === entKey)!
  const col = useMemo(() => (isWs ? isWs.columns.indexOf(entKey) : -1), [isWs, entKey])
  const rate = rates[ent.cur] || { avg: 0, closing: 0, name: ent.cur, entity: ent.name }

  function editRate(cur: string, field: 'avg' | 'closing', value: string) {
    setDraft((d) => ({ ...d, [cur]: { ...d[cur], [field]: parseFloat(value) || 0 } }))
    setSaved(false)
  }
  async function saveRates() {
    const r = await client.put('/consolidation/fx-rates', draft)
    setRates(r.data.rates)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }
  const dirty = JSON.stringify(rates) !== JSON.stringify(draft)

  return (
    <div>
      <Header
        title="Financial Import"
        subtitle="Non-NAWRAS entities — financials imported in base currency and translated to SAR, then fed into the consolidation."
      />

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-5 py-3 mb-5 text-sm text-emerald-900 flex items-start gap-2">
        <Upload size={16} className="text-emerald-600 mt-0.5 shrink-0" />
        <span>
          These four entities do not report through the NAWRAS ERP. Statements are imported in local currency and translated —
          <span className="font-semibold"> average rate for the Income Statement, closing rate for the Balance Sheet</span> — then connect to the OIG Consolidation.
        </span>
      </div>

      {/* FX control table — manual entry */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">FX rate control table <span className="font-normal text-slate-400">· manual entry (SAR per 1 unit)</span></div>
          <button
            onClick={saveRates}
            disabled={!dirty}
            className={`flex items-center gap-1.5 rounded-lg text-sm px-3 py-1.5 ${
              dirty ? 'brand-grad brand-ring text-white hover:opacity-90' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save rates</>}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 bg-slate-50 border-b border-slate-200">
              <th className="py-2 pl-5 text-left font-medium">Entity</th>
              <th className="py-2 px-3 text-left font-medium">Currency</th>
              <th className="py-2 px-3 text-right font-medium w-44">Average rate (IS)</th>
              <th className="py-2 px-3 text-right font-medium w-44">Closing rate (BS)</th>
            </tr>
          </thead>
          <tbody>
            {ENTITIES.map((e) => {
              const d = draft[e.cur] || { avg: 0, closing: 0, name: e.cur, entity: e.name }
              return (
                <tr key={e.cur} className="border-b border-slate-100">
                  <td className="py-2 pl-5 font-semibold text-slate-800">{e.name}</td>
                  <td className="py-2 px-3 text-slate-600">{e.cur} <span className="text-slate-400">{e.symbol}</span></td>
                  <td className="py-2 px-3 text-right">
                    <input type="number" step="0.0001" value={d.avg}
                      onChange={(ev) => editRate(e.cur, 'avg', ev.target.value)}
                      className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-right tabular-nums focus:border-emerald-400 outline-none" />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input type="number" step="0.0001" value={d.closing}
                      onChange={(ev) => editRate(e.cur, 'closing', ev.target.value)}
                      className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-right tabular-nums focus:border-emerald-400 outline-none" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-2 text-xs text-slate-400 border-t border-slate-100">
          Edit a rate and click Save — the translated figures below update immediately. 1 {ent.cur} = {rate.avg} SAR (avg) / {rate.closing} SAR (closing).
        </div>
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

      <StmtTable ws={isWs} col={col} rate={rate.avg} cur={ent.cur} rateLabel="Average rate (IS)" />
      <StmtTable ws={bsWs} col={col} rate={rate.closing} cur={ent.cur} rateLabel="Closing rate (BS)" />

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 flex items-center gap-2">
        <ArrowRight size={15} className="text-emerald-600" />
        The translated SAR column feeds directly into <span className="font-semibold text-slate-700">Consolidation → OIG Consolidation</span> as this entity's column.
      </div>
    </div>
  )
}
