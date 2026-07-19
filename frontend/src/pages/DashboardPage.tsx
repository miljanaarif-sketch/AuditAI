import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKey, Send, BookOpenCheck, GitCompareArrows, FileBarChart, ArrowRight } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'
import type { DashboardSummary } from '../types'

const BOXES = [
  {
    to: '/box1',
    icon: FolderKey,
    title: '1 · Internal Docs',
    subtitle: 'Legal pack · policies · contracts · governance',
  },
  {
    to: '/box2',
    icon: Send,
    title: '2 · External',
    subtitle: 'Customer · supplier · bank · legal / RP confirmations',
  },
  {
    to: '/box3',
    icon: BookOpenCheck,
    title: '3 · General Ledger',
    subtitle: 'TB · drill to document · JE testing',
  },
  {
    to: '/box4',
    icon: GitCompareArrows,
    title: '4 · Operational Reports',
    subtitle: 'Production · payroll & HR · procurement · treasury · recon engine',
  },
  {
    to: '/box5',
    icon: FileBarChart,
    title: '5 · Financial Reporting',
    subtitle: 'BS · IS · CF · equity · notes',
  },
]

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
}

const SEGMENTS = 20

function SegmentedBar({ pct }: { pct: number }) {
  const filled = Math.round((pct / 100) * SEGMENTS)
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span
          key={i}
          className={`h-3 w-1.5 rounded-[1px] ${i < filled ? 'bg-emerald-700' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    client.get('/dashboard/summary').then((res) => setSummary(res.data))
  }, [])

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Obeikan Plastic · FY2025 — the Five-Box Model at a glance."
      />

      <div className="grid grid-cols-5 gap-4 mb-8">
        {BOXES.map(({ to, icon: Icon, title, subtitle }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border-2 p-5 transition shadow-sm hover:shadow-md flex flex-col gap-3 bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100 active:bg-emerald-200 active:border-emerald-600"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 group-active:bg-emerald-700 group-active:text-white transition">
              <Icon size={22} />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{title}</div>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</div>
            </div>
            <ArrowRight size={16} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition" />
          </Link>
        ))}
      </div>

      {summary && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Progress by Five Boxes</h2>
              <span className="text-xs text-slate-400">weighted scorecard</span>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 mb-4">
              <div className="text-sm font-semibold text-emerald-900 whitespace-nowrap">Overall Audit Progress</div>
              <div className="flex-1 h-3.5 rounded-full bg-white border border-emerald-200 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${summary.overall_pct}%` }} />
              </div>
              <div className="text-xl font-bold text-emerald-800 w-14 text-right">{summary.overall_pct}%</div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-1.5 pr-3 font-medium">Section</th>
                  <th className="py-1.5 pr-3 font-medium text-right w-16">Weight</th>
                  <th className="py-1.5 pr-3 font-medium w-64">Progress</th>
                  <th className="py-1.5 font-medium text-right w-12">%</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {summary.progress.map((p) => (
                  <tr key={p.section} className="border-b border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-800 font-sans">{p.section}</td>
                    <td className="py-1.5 pr-3 text-right text-slate-500">{p.weight}%</td>
                    <td className="py-1.5 pr-3"><SegmentedBar pct={p.pct} /></td>
                    <td className="py-1.5 text-right font-medium text-slate-700">{p.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Actions</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Priority</th>
                  <th className="py-2 pr-4 font-medium">Item</th>
                  <th className="py-2 pr-4 font-medium">Owner</th>
                  <th className="py-2 pr-4 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {summary.pending_actions.map((a, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2 text-slate-700 capitalize">
                        <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[a.priority]}`} />
                        {a.priority}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-800">{a.item}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{a.owner}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{a.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
