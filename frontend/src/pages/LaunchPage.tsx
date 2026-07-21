import { Link } from 'react-router-dom'
import nawrasMark from '../assets/nawras-mark.png'
import {
  ArrowRight,
  FolderKey,
  Send,
  BookOpenCheck,
  GitCompareArrows,
  FileBarChart,
  Settings2,
  ShieldCheck,
  Link2,
  Sparkles,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FolderKey,
    title: 'Internal Documentation',
    text: 'Legal pack, policies, contracts and governance — collected once, latest version only, with a responsible owner for every pack.',
  },
  {
    icon: Send,
    title: 'External Confirmations',
    text: 'Circularisation built automatically. Request letters generated, replies logged against GL balances — sent, received, matched.',
  },
  {
    icon: BookOpenCheck,
    title: 'Drillable General Ledger',
    text: 'From any figure in the trial balance to the account, the journal and the source document — without leaving the platform.',
  },
  {
    icon: GitCompareArrows,
    title: 'Integrated Reports & Recons',
    text: 'Production, payroll & HR, procurement, treasury and tax reports reconciled to the GL, with variances flagged automatically.',
  },
  {
    icon: FileBarChart,
    title: 'Financial Reporting',
    text: 'Statements and notes assembled from reconciled data. Every line traces down to its evidence in a few clicks.',
  },
  {
    icon: Settings2,
    title: 'Master Data Configuration',
    text: 'Engagement reference data maintained once — only what is not already in the NAWRAS ERP.',
  },
]

const STATS = [
  { value: '5', label: 'boxes, one evidence chain' },
  { value: '114', label: 'required reports tracked' },
  { value: '22', label: 'audit areas covered' },
  { value: '100%', label: 'of numbers traceable to source' },
]

export default function LaunchPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <img src={nawrasMark} alt="NAWRAS" className="h-10 w-auto" />
          <div>
            <div className="text-xl font-bold tracking-tight">NAWRAS</div>
            <div className="text-xs font-medium text-emerald-400 tracking-wide">Plan • Validate • Report</div>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm px-4 py-2 hover:bg-emerald-400 transition"
        >
          Enter Platform
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium px-3 py-1.5 mb-6">
          <Sparkles size={13} /> End-to-end audit automation
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
          The audit platform where
          <br />
          <span className="text-emerald-400">every number opens to its source.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10">
          NAWRAS connects the financial statements to the evidence behind them — documents,
          confirmations, the general ledger, operational reports and reconciliations —
          in one continuous, drillable chain.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold px-6 py-3 hover:bg-emerald-400 transition"
          >
            Enter Platform <ArrowRight size={17} />
          </Link>
          <Link
            to="/box1"
            className="flex items-center gap-2 rounded-xl border border-slate-700 text-slate-200 font-medium px-6 py-3 hover:border-slate-500 transition"
          >
            Explore the Five Boxes
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">The Five-Box Model, automated</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Internal · External · Ledger · Integrated Reports · Output — one platform,
            one evidence chain, no repeated document requests.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-emerald-500/40 transition"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 mb-4">
                <Icon size={20} />
              </span>
              <div className="font-semibold mb-2">{title}</div>
              <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust band */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-emerald-500/10 to-slate-900 p-6 lg:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Link2 size={24} />
            </span>
            <div>
              <div className="text-lg font-semibold">FS line → report → GL → confirmation → document</div>
              <div className="text-sm text-slate-400">
                The trace-down that used to take days of requests now takes a few clicks.
              </div>
            </div>
          </div>
          <Link
            to="/box5"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold px-5 py-2.5 hover:bg-emerald-400 transition whitespace-nowrap"
          >
            See it live <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-slate-500">
          <div>NAWRAS · End-to-End Audit Automation</div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} /> Prototype
          </div>
        </div>
      </footer>
    </div>
  )
}
