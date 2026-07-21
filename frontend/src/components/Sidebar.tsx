import { NavLink, Link } from 'react-router-dom'
import nawrasMark from '../assets/nawras-mark.png'
import {
  LayoutDashboard,
  Settings2,
  FolderKey,
  Send,
  BookOpenCheck,
  GitCompareArrows,
  FileBarChart,
  MessagesSquare,
} from 'lucide-react'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/master-data', label: 'Master Data Configuration', icon: Settings2 },
  { to: '/box1', label: '1 · Internal Documentation', icon: FolderKey },
  { to: '/box2', label: '2 · External Confirmations', icon: Send },
  { to: '/box3', label: '3 · General Ledger', icon: BookOpenCheck },
  { to: '/box4', label: '4 · Integrated Reports & Recons', icon: GitCompareArrows },
  { to: '/box5', label: '5 · Financial Reporting', icon: FileBarChart },
  { to: '/comms', label: 'Auditor Communications', icon: MessagesSquare },
]

export default function Sidebar() {
  return (
    <aside className="w-72 shrink-0 bg-slate-900 text-slate-200 h-screen sticky top-0 overflow-y-auto flex flex-col">
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800 hover:bg-slate-800/50 transition">
        <img src={nawrasMark} alt="NAWRAS" className="h-9 w-auto shrink-0" />
        <div>
          <div className="text-lg font-bold text-white tracking-tight">NAWRAS</div>
          <div className="text-xs font-medium text-emerald-400 mt-0.5 tracking-wide">Plan • Validate • Report</div>
        </div>
      </Link>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-slate-500 border-t border-slate-800">
        Five-Box Model prototype
      </div>
    </aside>
  )
}
