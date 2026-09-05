import { useEffect, useMemo, useState } from 'react'
import { Globe, ArrowRight, Plus, X } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'

type Ws = {
  key: string; title: string; columns: string[]
  rows: { label: string; kind: string; values: (number | null)[] }[]
}
type Rate = { avg: number; closing: number }
type Rates = Record<string, Rate>
type Entity = { key: string; name: string; cur: string; symbol: string }

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  const r = Math.round(n)
  if (r === 0) return '—'
  const s = new Intl.NumberFormat('en-US').format(Math.abs(r))
  return r < 0 ? `(${s})` : s
}

function isEntityCol(label: string): boolean {
  return !/(Consolidation|Standalone|CONSOLIDATED|UNCONSOLIDATED|^TOTAL|^ELIMIN)/.test(label)
}

function StmtTable({ ws, col, rate, cur }: { ws: Ws | null; col: number; rate: number; cur: string }) {
  if (!ws || col < 0) return null
  const rows = ws.rows
    .map((r) => ({ label: r.label, kind: r.kind, sar: r.values[col] ?? null }))
    .filter((r) => r.kind === 'header' || r.kind === 'total' || r.sar !== null)
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-5">
      <div className="px-5 py-3 border-b border-slate-100">
        <div className="text-sm font-semibold text-slate-800">{ws.title}</div>
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
  const [rates, setRates] = useState<Rates>({})
  const [entities, setEntities] = useState<Entity[]>([])
  const [entKey, setEntKey] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', cur: '', symbol: '', key: '' })

  useEffect(() => {
    client.get('/consolidation/worksheets/IS').then((r) => setIsWs(r.data))
    client.get('/consolidation/worksheets/BS').then((r) => setBsWs(r.data))
    client.get('/consolidation/fx-rates').then((r) => setRates(r.data))
    client.get('/consolidation/fx-entities').then((r) => { setEntities(r.data); if (r.data[0]) setEntKey(r.data[0].key) })
  }, [])

  const ent = entities.find((e) => e.key === entKey)
  const col = useMemo(() => (isWs && ent ? isWs.columns.indexOf(ent.key) : -1), [isWs, ent])
  const rate = ent ? rates[ent.cur] || { avg: 0, closing: 0 } : { avg: 0, closing: 0 }
  const colOptions = useMemo(() => (isWs ? isWs.columns.filter(isEntityCol) : []), [isWs])

  async function addEntity() {
    if (!form.name || !form.cur) return
    const payload = { ...form, key: form.key || form.name }
    const r = await client.post('/consolidation/fx-entities', payload)
    setEntities(r.data)
    setForm({ name: '', cur: '', symbol: '', key: '' })
    setAdding(false)
  }
  async function removeEntity(key: string) {
    const r = await client.delete(`/consolidation/fx-entities/${encodeURIComponent(key)}`)
    setEntities(r.data)
    if (entKey === key && r.data[0]) setEntKey(r.data[0].key)
  }

  return (
    <div>
      <Header
        title="Financial Import"
        subtitle="Imported (non-NAWRAS) entities — statements in base currency, translated to SAR, feeding the consolidation."
      />

      {/* managed entity list */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-slate-800">
            Imported entities <span className="font-normal text-slate-400">· {entities.length} added</span>
          </div>
          <button
            onClick={() => setAdding((a) => !a)}
            className="flex items-center gap-1.5 rounded-lg brand-grad brand-ring text-white text-sm px-3 py-1.5 hover:opacity-90"
          >
            <Plus size={14} /> Add entity
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Globe size={16} className="text-slate-500" />
          {entities.map((e) => (
            <span key={e.key} className="inline-flex items-center">
              <button
                onClick={() => setEntKey(e.key)}
                className={`rounded-l-lg px-3 py-1.5 text-sm ${
                  entKey === e.key ? 'brand-grad brand-ring text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'
                }`}
              >
                {e.name} <span className="opacity-70">· {e.cur}</span>
              </button>
              <button
                onClick={() => removeEntity(e.key)}
                title="Remove"
                className={`rounded-r-lg px-1.5 py-1.5 border-l ${
                  entKey === e.key ? 'brand-grad text-white/80 border-white/20' : 'bg-white border border-slate-200 text-slate-300 hover:text-rose-500'
                }`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        {adding && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Entity name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Turkey" className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Currency</label>
              <input value={form.cur} onChange={(e) => setForm({ ...form, cur: e.target.value })}
                placeholder="e.g. TRY" className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Symbol</label>
              <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                placeholder="e.g. ₺" className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Data column</label>
              <select value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm">
                <option value="">— none (name) —</option>
                {colOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={addEntity} disabled={!form.name || !form.cur}
              className="rounded-lg bg-slate-800 text-white text-sm px-3 py-2 hover:bg-slate-900 disabled:opacity-40">
              Add
            </button>
          </div>
        )}
      </div>

      {ent ? (
        <>
          <StmtTable ws={isWs} col={col} rate={rate.avg} cur={ent.cur} />
          <StmtTable ws={bsWs} col={col} rate={rate.closing} cur={ent.cur} />
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 flex items-center gap-2">
            <ArrowRight size={15} className="text-emerald-600" />
            The translated SAR column feeds into <span className="font-semibold text-slate-700">Consolidation → OIG Consolidation</span> as this entity's column.
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-400 py-8">Select or add an entity to view its statements.</div>
      )}
    </div>
  )
}
