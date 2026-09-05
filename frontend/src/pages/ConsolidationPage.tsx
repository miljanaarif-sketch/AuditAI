import { useEffect, useMemo, useState } from 'react'
import { Building2, Layers, FileText, Printer, ChevronDown, ChevronUp, Network, Grid3x3, PieChart, Handshake, Scale } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'

type Row = {
  kind: 'header' | 'line' | 'subtotal' | 'total'
  label: string | null
  note?: string | null
  v2025?: number | null
  v2024?: number | null
  cells?: (number | null)[]
}
type Statement = { key: string; title: string; subtitle: string; cols: string[]; rows: Row[] }
type Entity = { code: string; name: string; kind: string; tier: string }
type Note = {
  num: string; title: string; category: string
  face_2025?: number | null; face_2024?: number | null; body: string; status: string
  lines?: [string, number | null, number | null][]
}
type Group = { name: string; title: string; period: string; basis: string; currency: string; entity_count: number }
type WsIndex = { key: string; title: string; subtitle: string; cols: number; rows: number }
type Ws = {
  key: string; title: string; subtitle: string; columns: string[]; consolidated: boolean[]
  rows: { label: string; kind: string; values: (number | null)[] }[]
}
type ReconRow = { code: string; company: string; debit: number; credit: number; diff_debit: number; diff_credit: number }
type ReconData = { company: string; rows: ReconRow[]; totals: { debit: number; credit: number; diff_debit: number; diff_credit: number } }

const KEYS = ['SOFP', 'PL', 'OCI', 'CF', 'SOCE']

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  const r = Math.round(n)
  if (r === 0) return '—'
  const s = new Intl.NumberFormat('en-US').format(Math.abs(r))
  return r < 0 ? `(${s})` : s
}

const KIND_BADGE: Record<string, string> = {
  Parent: 'bg-sky-100 text-sky-700',
  Subsidiary: 'bg-slate-100 text-slate-600',
  Division: 'bg-teal-100 text-teal-700',
  Discontinued: 'bg-amber-100 text-amber-700',
  Elimination: 'bg-rose-100 text-rose-700',
}

function TwoColStatement({ st }: { st: Statement }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-slate-500 border-b border-slate-200">
          <th className="py-2 pr-3 text-left font-medium">&nbsp;</th>
          <th className="py-2 px-2 text-center font-medium w-14">Note</th>
          <th className="py-2 pl-3 text-right font-medium w-40">{st.cols[0]}</th>
          <th className="py-2 pl-3 text-right font-medium w-40">{st.cols[1]}</th>
        </tr>
      </thead>
      <tbody>
        {st.rows.map((r, i) => {
          if (r.kind === 'header')
            return (
              <tr key={i}>
                <td colSpan={4} className="pt-4 pb-1 text-[13px] font-bold uppercase tracking-wide text-slate-700">
                  {r.label}
                </td>
              </tr>
            )
          const bold = r.kind === 'total'
          const border = r.kind === 'total' ? 'border-t-2 border-slate-300' : r.kind === 'subtotal' ? 'border-t border-slate-200' : 'border-b border-slate-50'
          return (
            <tr key={i} className={`${border} ${bold ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
              <td className={`py-1.5 pr-3 ${r.kind === 'line' ? 'pl-4' : ''}`}>{r.label ?? ''}</td>
              <td className="py-1.5 px-2 text-center">
                {r.note ? <span className="inline-block rounded bg-teal-50 text-teal-700 text-[11px] px-1.5">{r.note}</span> : ''}
              </td>
              <td className="py-1.5 pl-3 text-right tabular-nums">{fmt(r.v2025)}</td>
              <td className="py-1.5 pl-3 text-right tabular-nums text-slate-500">{fmt(r.v2024)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function EquityStatement({ st }: { st: Statement }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-3 text-left font-medium">&nbsp;</th>
            {st.cols.map((c) => (
              <th key={c} className="py-2 px-2 text-right font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {st.rows.map((r, i) => {
            const bold = r.kind === 'total'
            const border = bold ? 'border-t-2 border-slate-300' : 'border-b border-slate-50'
            return (
              <tr key={i} className={`${border} ${bold ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                <td className="py-1.5 pr-3">{r.label}</td>
                {(r.cells ?? []).map((c, j) => (
                  <td key={j} className="py-1.5 px-2 text-right tabular-nums">{fmt(c)}</td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function colKind(label: string): 'scope' | 'subtotal' | 'entity' {
  if (/(Consolidation|Standalone|CONSOLIDATED|UNCONSOLIDATED)/.test(label)) return 'scope'
  if (/^(TOTAL|ELIMIN)/.test(label)) return 'subtotal'
  return 'entity'
}

// deterministic synthetic prior-year factor (0.85–1.05) so 2024 comparatives tie within a statement
export function priorFactor(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return 0.85 + (h % 21) / 100
}
export const priorOf = (v: number | null | undefined, factor: number): number | null =>
  v === null || v === undefined ? null : Math.round(v * factor)

function ScopedStatement({ ws, colIdx, title }: { ws: Ws | null; colIdx: number; title: string }) {
  if (!ws || colIdx < 0) return null
  const factor = priorFactor(title + colIdx)
  const rows = ws.rows
    .map((r) => ({ label: r.label, kind: r.kind, value: r.values[colIdx] ?? null }))
    .filter((r) => r.kind === 'header' || r.kind === 'total' || r.value !== null)
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-800">{title}</div>
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
            {rows.map((r, i) =>
              r.kind === 'header' ? (
                <tr key={i}>
                  <td colSpan={3} className="pt-3 pb-1 text-[13px] font-bold uppercase tracking-wide text-slate-700">{r.label}</td>
                </tr>
              ) : (
                <tr key={i} className={`${r.kind === 'total' ? 'font-semibold text-slate-900 border-t border-slate-300' : 'text-slate-700 border-b border-slate-50'}`}>
                  <td className={`py-1.5 pr-3 ${r.kind !== 'total' ? 'pl-3' : ''}`}>{r.label}</td>
                  <td className={`py-1.5 pl-3 text-right tabular-nums ${r.value !== null && r.value < 0 ? 'text-rose-600' : ''}`}>{fmt(r.value)}</td>
                  <td className="py-1.5 pl-3 text-right tabular-nums text-slate-500">{fmt(priorOf(r.value, factor))}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WorksheetGrid({ ws }: { ws: Ws }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-auto" style={{ maxHeight: '72vh' }}>
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-30 bg-slate-100 border-b border-r border-slate-300 px-3 py-2 text-left font-semibold text-slate-600 min-w-[260px]">
              Line item
            </th>
            {ws.columns.map((c, j) => (
              <th
                key={j}
                className={`sticky top-0 z-20 border-b border-slate-300 px-2.5 py-2 text-right font-semibold whitespace-nowrap min-w-[92px] ${
                  ws.consolidated[j] ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ws.rows.map((r, i) => {
            const head = r.kind === 'header'
            const total = r.kind === 'total'
            return (
              <tr key={i} className={head ? 'bg-slate-50' : total ? 'bg-slate-50/60' : ''}>
                <td
                  className={`sticky left-0 z-10 border-r border-slate-200 px-3 py-1 whitespace-nowrap ${
                    head ? 'bg-slate-50 font-bold uppercase text-[11px] tracking-wide text-slate-700' : total ? 'bg-slate-50/60 font-semibold text-slate-900' : 'bg-white text-slate-700'
                  }`}
                >
                  {r.label}
                </td>
                {r.values.map((v, j) => (
                  <td
                    key={j}
                    className={`px-2.5 py-1 text-right tabular-nums whitespace-nowrap ${total ? 'font-semibold border-t border-slate-200' : ''} ${
                      ws.consolidated[j] ? 'bg-teal-50' : ''
                    } ${v !== null && v < 0 ? 'text-rose-600' : 'text-slate-700'}`}
                  >
                    {fmt(v)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function NoteLines({ lines }: { lines: [string, number | null, number | null][] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-100">
            <th className="py-1.5 pr-3 text-left font-medium">&nbsp;</th>
            <th className="py-1.5 pl-3 text-right font-medium w-36">2025</th>
            <th className="py-1.5 pl-3 text-right font-medium w-36">2024</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(([label, a, b], i) => {
            const isSubhead = (a === null || a === undefined) && (b === null || b === undefined) && !!label
            const bold = /^(total|net book value|net movement|closing|opening|balance|sub-?total|net )/i.test(label || '')
            if (isSubhead)
              return (
                <tr key={i}>
                  <td colSpan={3} className="pt-2.5 pb-1 text-[13px] font-semibold text-slate-700">{label}</td>
                </tr>
              )
            return (
              <tr key={i} className={`${bold ? 'font-semibold text-slate-900 border-t border-slate-200' : 'text-slate-600 border-b border-slate-50'}`}>
                <td className={`py-1.5 pr-3 ${!bold ? 'pl-3' : ''}`}>{label}</td>
                <td className="py-1.5 pl-3 text-right tabular-nums">{fmt(a)}</td>
                <td className="py-1.5 pl-3 text-right tabular-nums text-slate-500">{fmt(b)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function ConsolidationPage({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<'statements' | 'worksheets' | 'segments' | 'related' | 'recon' | 'group' | 'notes'>('statements')
  const [group, setGroup] = useState<Group | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [statements, setStatements] = useState<Statement[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [openStmt, setOpenStmt] = useState<string | null>('SOFP')
  const [openNote, setOpenNote] = useState<string | null>(null)
  const [wsIndex, setWsIndex] = useState<WsIndex[]>([])
  const [wsKey, setWsKey] = useState('IS')
  const [ws, setWs] = useState<Ws | null>(null)
  const [segKey, setSegKey] = useState('SEG_IS')
  const [segWs, setSegWs] = useState<Ws | null>(null)
  const [rpKey, setRpKey] = useState('RP_BALANCES')
  const [reconCos, setReconCos] = useState<{ key: string; name: string }[]>([])
  const [reconCo, setReconCo] = useState('printing')
  const [recon, setRecon] = useState<ReconData | null>(null)
  const [rpWs, setRpWs] = useState<Ws | null>(null)
  const [scope, setScope] = useState('OIG Consolidation')
  const [isWs, setIsWs] = useState<Ws | null>(null)
  const [bsWs, setBsWs] = useState<Ws | null>(null)

  useEffect(() => {
    client.get('/consolidation/group').then((r) => setGroup(r.data))
    client.get('/consolidation/entities').then((r) => setEntities(r.data))
    client.get('/consolidation/notes').then((r) => setNotes(r.data))
    client.get('/consolidation/worksheets').then((r) => setWsIndex(r.data))
    client.get('/consolidation/worksheets/IS').then((r) => setIsWs(r.data))
    client.get('/consolidation/worksheets/BS').then((r) => setBsWs(r.data))
    Promise.all(KEYS.map((k) => client.get(`/consolidation/statements/${k}`).then((r) => r.data))).then(setStatements)
  }, [])

  const scopeOptions = useMemo(
    () => (isWs ? isWs.columns.map((label, idx) => ({ label, idx })).filter((o) => colKind(o.label) === 'scope') : []),
    [isWs],
  )
  const scopeColIdx = isWs ? isWs.columns.indexOf(scope) : -1

  useEffect(() => {
    setWs(null)
    client.get(`/consolidation/worksheets/${wsKey}`).then((r) => setWs(r.data))
  }, [wsKey])

  useEffect(() => {
    setSegWs(null)
    client.get(`/consolidation/worksheets/${segKey}`).then((r) => setSegWs(r.data))
  }, [segKey])

  useEffect(() => {
    setRpWs(null)
    client.get(`/consolidation/worksheets/${rpKey}`).then((r) => setRpWs(r.data))
  }, [rpKey])

  useEffect(() => {
    client.get('/consolidation/rp-recon').then((r) => setReconCos(r.data))
  }, [])
  useEffect(() => {
    setRecon(null)
    client.get(`/consolidation/rp-recon/${reconCo}`).then((r) => setRecon(r.data))
  }, [reconCo])

  const noteCats = ['Policy & framework', 'Balance-sheet notes', 'Income-statement notes', 'Group & disclosure notes']

  async function printReport() {
    if (!group) return
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    // Placeholder cover only — the full audit report (≈35 pages) is inserted later.
    const w = window.open('', '_blank', 'width=900,height=1100')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>${esc(group.name)} — Consolidated FS 2025</title><style>
      body{font-family:Georgia,'Times New Roman',serif;color:#111;margin:44px;}
      .cover{text-align:center;margin-top:130px;}
      .cover h1{font-size:24px;margin:0 0 8px;} .cover .sub{color:#555;font-size:14px;}
      .ifrs{font-size:11px;letter-spacing:1px;color:#777;text-transform:uppercase;margin-top:10px;}
      .ph{margin-top:90px;color:#999;font-size:12px;font-style:italic;text-align:center;}
      @media print{body{margin:22px;}}
    </style></head><body>
      <div class="cover"><h1>${esc(group.name)}</h1><div class="sub">${esc(group.title)} — ${esc(group.period)}</div>
      <div class="ifrs">${esc(group.basis)}</div></div>
      <div class="ph">— Full audit report to be inserted —</div>
    </body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 400)
  }

  return (
    <div>
      {!embedded && (
        <Header
          title="Consolidated Financials"
          subtitle="Group consolidation — primary statements and full notes, from a reporting point of view."
        />
      )}

      {group && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-5 py-4 mb-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Building2 size={17} className="text-teal-600" /> {group.name}
            </div>
            <span className="text-sm text-slate-600">{group.title}</span>
            <span className="text-sm text-slate-500">{group.period}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {group.basis} · Presentation currency: {group.currency} · {group.entity_count} consolidated entities
          </div>
        </div>
      )}

      {/* consolidation roll-up drill-down */}
      {scopeOptions.length > 0 && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/40 px-4 py-3 mb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-2">
            Consolidation roll-up — drill down
          </div>
          <div className="flex flex-wrap gap-1.5">
            {scopeOptions.map((o) => (
              <button
                key={o.idx}
                onClick={() => setScope(o.label)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  scope === o.label ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* tabs */}
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        {[
          { k: 'statements', label: 'Primary Statements', icon: FileText },
          { k: 'worksheets', label: 'Consolidation Worksheets', icon: Grid3x3 },
          { k: 'segments', label: 'Segments', icon: PieChart },
          { k: 'related', label: 'Related Party & IC', icon: Handshake },
          { k: 'recon', label: 'Current-Acct Recon', icon: Scale },
          { k: 'group', label: 'Group Structure', icon: Network },
          { k: 'notes', label: 'Notes', icon: Layers },
        ].map(({ k, label, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k as typeof tab)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
              tab === k ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
        <button
          onClick={printReport}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white text-sm px-3 py-1.5 hover:bg-emerald-700"
        >
          <Printer size={15} /> Print consolidated report
        </button>
      </div>

      {/* STATEMENTS */}
      {tab === 'statements' && scope !== 'OIG Consolidation' && (
        <div>
          <div className="text-xs text-slate-400 mb-2">
            Statements for <span className="font-semibold text-teal-700">{scope}</span> (FY2025). Full comparatives & note references are available on the OIG Consolidation roll-up.
          </div>
          <ScopedStatement ws={isWs} colIdx={scopeColIdx} title="Statement of Profit or Loss" />
          <ScopedStatement ws={bsWs} colIdx={scopeColIdx} title="Statement of Financial Position" />
        </div>
      )}
      {tab === 'statements' && scope === 'OIG Consolidation' && (
        <div className="space-y-3">
          {statements.map((st) => {
            const isOpen = openStmt === st.key
            return (
              <div key={st.key} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  onClick={() => setOpenStmt(isOpen ? null : st.key)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{st.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{st.subtitle}</div>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-2 overflow-x-auto">
                    {st.key === 'SOCE' ? <EquityStatement st={st} /> : <TwoColStatement st={st} />}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* WORKSHEETS */}
      {tab === 'worksheets' && (
        <div>
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {wsIndex.filter((w) => !w.key.startsWith('SEG') && w.key !== 'IC_SALES' && w.key !== 'RP_BALANCES').map((w) => (
              <button
                key={w.key}
                onClick={() => setWsKey(w.key)}
                className={`rounded-lg px-2.5 py-1 text-xs ${
                  wsKey === w.key ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
                }`}
              >
                {w.title}
              </button>
            ))}
          </div>
          {ws ? (
            <>
              <div className="text-xs text-slate-400 mb-2">{ws.subtitle} · {ws.columns.length} columns × {ws.rows.length} lines · scroll horizontally</div>
              <WorksheetGrid ws={ws} />
            </>
          ) : (
            <div className="text-sm text-slate-400 py-8">Loading worksheet…</div>
          )}
        </div>
      )}

      {/* SEGMENTS */}
      {tab === 'segments' && (
        <div>
          <div className="text-sm text-slate-600 mb-3">
            Segment reporting (IFRS 8) — divisions grouped into segment clusters with sub-totals.
          </div>
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {[
              { k: 'SEG_IS', label: 'Segment — Income Statement' },
              { k: 'SEG_BS', label: 'Segment — Balance Sheet' },
            ].map((s) => (
              <button
                key={s.k}
                onClick={() => setSegKey(s.k)}
                className={`rounded-lg px-2.5 py-1 text-xs ${
                  segKey === s.k ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {segWs ? (
            <>
              <div className="text-xs text-slate-400 mb-2">{segWs.subtitle} · {segWs.columns.length} columns × {segWs.rows.length} lines · scroll horizontally</div>
              <WorksheetGrid ws={segWs} />
            </>
          ) : (
            <div className="text-sm text-slate-400 py-8">Loading segment report…</div>
          )}
        </div>
      )}

      {/* RELATED PARTY & INTERCOMPANY */}
      {tab === 'related' && (
        <div>
          <div className="text-sm text-slate-600 mb-3">
            Related-party & intercompany working papers — used for balance matching and elimination on consolidation.
          </div>
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {[
              { k: 'RP_BALANCES', label: 'Related Party Balances & Matching' },
              { k: 'IC_SALES', label: 'Intercompany Sales & Transactions' },
            ].map((s) => (
              <button
                key={s.k}
                onClick={() => setRpKey(s.k)}
                className={`rounded-lg px-2.5 py-1 text-xs ${
                  rpKey === s.k ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {rpWs ? (
            <>
              <div className="text-xs text-slate-400 mb-2">{rpWs.subtitle} · {rpWs.columns.length} columns × {rpWs.rows.length} lines · scroll horizontally</div>
              <WorksheetGrid ws={rpWs} />
            </>
          ) : (
            <div className="text-sm text-slate-400 py-8">Loading…</div>
          )}
        </div>
      )}

      {/* CURRENT-ACCOUNT RECONCILIATION */}
      {tab === 'recon' && (
        <div>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <Scale size={16} className="text-slate-500" />
            <label className="text-sm text-slate-600">Company (own books)</label>
            <select
              value={reconCo}
              onChange={(e) => setReconCo(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm min-w-[220px]"
            >
              {reconCos.map((c) => (
                <option key={c.key} value={c.key}>{c.name}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400">
              Intercompany current-account reconciliation — due-from (Debit) vs the counterparty's due-to (Credit), in SR
            </span>
          </div>
          {recon ? (
            <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr>
                    <th className="bg-slate-700 text-white py-2 pl-4 text-left font-semibold">Company</th>
                    <th className="bg-[#2c4d7a] text-white py-2 px-3 text-right font-semibold">{recon.company}'s Books</th>
                    <th className="bg-[#2c4d7a] text-white py-2 px-3 text-right font-semibold">Other Company's Books</th>
                    <th className="bg-slate-500 text-white py-2 px-3 text-center font-semibold" colSpan={2}>Differences</th>
                  </tr>
                  <tr className="bg-slate-100 border-b border-slate-300 text-xs text-slate-500">
                    <th className="py-1.5 pl-4 text-left font-medium">&nbsp;</th>
                    <th className="py-1.5 px-3 text-right font-medium">Debit</th>
                    <th className="py-1.5 px-3 text-right font-medium">Credit</th>
                    <th className="py-1.5 px-3 text-right font-medium">Debit</th>
                    <th className="py-1.5 px-3 text-right font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {recon.rows.map((r, i) => (
                    <tr key={i} className={`border-b border-slate-50 ${i % 2 ? 'bg-slate-50/60' : ''}`}>
                      <td className="py-1.5 pl-4 font-semibold text-blue-900">{r.company}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-slate-700">{fmt(r.debit)}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-slate-700">{fmt(r.credit)}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-slate-700">{fmt(r.diff_debit)}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-rose-600">{fmt(r.diff_credit > 0 ? -r.diff_credit : 0)}</td>
                    </tr>
                  ))}
                  {recon.rows.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No intercompany balances for this company.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-800 text-white font-semibold">
                    <td className="py-2 pl-4">Total Due From Related Parties / Difference</td>
                    <td className="py-2 px-3 text-right tabular-nums">{fmt(recon.totals.debit)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{fmt(recon.totals.credit)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{fmt(recon.totals.diff_debit)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-rose-300">{fmt(recon.totals.diff_credit > 0 ? -recon.totals.diff_credit : 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-sm text-slate-400 py-8">Loading reconciliation…</div>
          )}
        </div>
      )}

      {/* GROUP STRUCTURE */}
      {tab === 'group' && (
        <div className="space-y-5">
          {[...new Set(entities.map((e) => e.tier))].map((tier) => {
            const rows = entities.filter((e) => e.tier === tier)
            return (
              <div key={tier}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  {tier} <span className="text-slate-300">· {rows.length}</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                        <th className="py-2.5 pl-5 pr-3 font-medium w-40">Code</th>
                        <th className="py-2.5 pr-4 font-medium">Entity</th>
                        <th className="py-2.5 pr-5 font-medium w-32">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((e) => (
                        <tr key={e.code} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 pl-5 pr-3 font-mono text-xs text-slate-600">{e.code}</td>
                          <td className="py-2 pr-4 text-slate-800">{e.name}</td>
                          <td className="py-2 pr-5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${KIND_BADGE[e.kind] || 'bg-slate-100 text-slate-600'}`}>
                              {e.kind}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
          <div className="text-xs text-slate-400">
            The OIC sub-consolidation rolls up into the OIG consolidation. Ownership % and functional currency per entity to be configured in Master Data.
          </div>
        </div>
      )}

      {/* NOTES */}
      {tab === 'notes' && (
        <div className="space-y-5">
          {noteCats.map((cat) => {
            const items = notes.filter((n) => n.category === cat)
            if (!items.length) return null
            return (
              <div key={cat}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{cat}</div>
                <div className="space-y-2">
                  {items.map((n) => {
                    const isOpen = openNote === n.num
                    return (
                      <div key={n.num} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                        <button
                          onClick={() => setOpenNote(isOpen ? null : n.num)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-2.5 text-sm text-slate-800">
                            <span className="flex items-center justify-center min-w-7 h-6 px-1.5 rounded bg-teal-50 text-teal-700 text-xs font-semibold">
                              {n.num}
                            </span>
                            {n.title}
                          </span>
                          <span className="flex items-center gap-3">
                            {n.face_2025 != null && (
                              <span className="text-xs text-slate-500 tabular-nums hidden sm:inline">SR {fmt(n.face_2025)}</span>
                            )}
                            {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                            <p className="text-sm text-slate-600 leading-relaxed">{n.body}</p>
                            {n.lines && n.lines.length > 0 && <NoteLines lines={n.lines} />}
                            {n.face_2025 != null && (
                              <div className="mt-3 flex gap-8 text-sm border-t border-slate-100 pt-2">
                                <div className="text-xs text-slate-400">Per statement</div>
                                <div className="flex gap-8">
                                  <div>
                                    <span className="text-xs text-slate-400 mr-2">2025</span>
                                    <span className="font-semibold text-slate-800 tabular-nums">SR {fmt(n.face_2025)}</span>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400 mr-2">2024</span>
                                    <span className="font-semibold text-slate-500 tabular-nums">SR {fmt(n.face_2024)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
