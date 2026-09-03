import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Search, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import Header from '../components/Header'

type Item = {
  sno: string; num: string; level: number; name: string
  oig: string; oic: string; dv: string; overall: string; covered: string | null
}
type Info = {
  title: string; reporting_date: string; total: number; note: string
  level_titles: Record<string, string>; scopes: string[]
  status_cols: { key: string; label: string }[]
}
type Summary = {
  overall: Record<string, number>; total: number
  per_level: Record<string, { title: string; total: number; ready: number; blocked: number; counts: Record<string, number> }>
}

const OVERALL_BADGE: Record<string, string> = {
  Ready: 'bg-emerald-100 text-emerald-700',
  Blocked: 'bg-rose-100 text-rose-700',
  'N/A': 'bg-slate-100 text-slate-500',
  Future: 'bg-amber-100 text-amber-700',
  Query: 'bg-sky-100 text-sky-700',
}

function statusColor(v: string): string {
  if (!v) return 'text-emerald-600'
  if (/not available|incorrect|hold|not matching/i.test(v)) return 'text-rose-600'
  if (/future|confirm/i.test(v)) return 'text-amber-600'
  return 'text-slate-400'
}
const statusText = (v: string) => (v ? v : '✓ ready')

export default function AuditTrackerPage() {
  const [info, setInfo] = useState<Info | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [level, setLevel] = useState<number | 'all'>('all')
  const [status, setStatus] = useState<string>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    client.get('/tracker/info').then((r) => setInfo(r.data))
    client.get('/tracker/items').then((r) => setItems(r.data))
    client.get('/tracker/summary').then((r) => setSummary(r.data))
  }, [])

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (level === 'all' || i.level === level) &&
          (status === 'all' || i.overall === status) &&
          (!q || i.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [items, level, status, q],
  )

  const overallKeys = ['Ready', 'Blocked', 'N/A', 'Future', 'Query']

  return (
    <div>
      <Header
        title="Audit Report Tracker"
        subtitle="Report-readiness across consolidation levels — what's ready, what's blocking the audit."
      />

      {info && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-5 py-4 mb-5 flex flex-wrap items-center gap-x-6 gap-y-1">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <ClipboardList size={17} className="text-indigo-600" /> {info.title}
          </div>
          <span className="text-sm text-slate-500">Reporting date: {info.reporting_date}</span>
          <span className="text-sm text-slate-500">{info.total} reports tracked</span>
          <span className="text-xs text-slate-400 basis-full">{info.note}</span>
        </div>
      )}

      {/* summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {Object.entries(summary.per_level).map(([lvl, s]) => {
            const pct = s.total ? Math.round((s.ready / s.total) * 100) : 0
            return (
              <div key={lvl} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-400 mb-1">Level {lvl}</div>
                <div className="text-sm font-semibold text-slate-800 mb-2 leading-snug">{s.title}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-600">{s.ready}</span>
                  <span className="text-sm text-slate-400">/ {s.total} ready</span>
                  <span className="ml-auto text-sm text-rose-600 font-medium">{s.blocked} blocked</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-center gap-1">
          {(['all', 1, 2, 3] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-lg px-2.5 py-1 text-xs ${
                level === l ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {l === 'all' ? 'All levels' : `Level ${l}`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {['all', ...overallKeys].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-2.5 py-1 text-xs ${
                status === s ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? 'All status' : s}
              {s !== 'all' && summary ? <span className="opacity-60"> ({summary.overall[s] || 0})</span> : ''}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports…"
            className="rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm w-56"
          />
        </div>
      </div>

      {/* table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
              <th className="py-2.5 pl-4 pr-2 font-medium w-14">#</th>
              <th className="py-2.5 pr-4 font-medium">Report</th>
              {info?.status_cols.map((c) => (
                <th key={c.key} className="py-2.5 pr-4 font-medium w-40">{c.label}</th>
              ))}
              <th className="py-2.5 pr-4 font-medium w-24">Overall</th>
              <th className="py-2.5 pr-4 font-medium w-24">Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.sno} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 pl-4 pr-2 text-slate-400 tabular-nums">{i.num}</td>
                <td className="py-2 pr-4 text-slate-800">
                  <span className="text-[11px] text-slate-400 mr-1.5">{i.sno}</span>
                  {i.name}
                </td>
                {(['oig', 'oic', 'dv'] as const).map((k) => (
                  <td key={k} className={`py-2 pr-4 text-xs ${statusColor(i[k])}`}>{statusText(i[k])}</td>
                ))}
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${OVERALL_BADGE[i.overall] || 'bg-slate-100'}`}>
                    {i.overall}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  {i.covered ? (
                    <Link to="/consolidation" className="flex items-center gap-1 text-xs text-teal-700 hover:underline">
                      {i.covered} <ExternalLink size={11} />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-400">No reports match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {info && (
        <div className="mt-4 text-xs text-slate-400">
          <span className="font-medium text-slate-500">Consolidation scopes tracked:</span>{' '}
          {info.scopes.join('  ·  ')}
        </div>
      )}
    </div>
  )
}
