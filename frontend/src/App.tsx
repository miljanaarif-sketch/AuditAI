import { useState } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import nawrasMark from './assets/nawras-mark.png'
import LaunchPage from './pages/LaunchPage'
import DashboardPage from './pages/DashboardPage'
import MasterDataPage from './pages/MasterDataPage'
import Box1InternalPage from './pages/Box1InternalPage'
import Box2ExternalPage from './pages/Box2ExternalPage'
import Box3LedgerPage from './pages/Box3LedgerPage'
import Box4ModulesPage from './pages/Box4ModulesPage'
import Box5ReportingPage from './pages/Box5ReportingPage'
import CommunicationsPage from './pages/CommunicationsPage'

function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 min-w-0">
        {/* mobile top bar with hamburger */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-14 bg-slate-900 text-white px-4">
          <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="p-1 -ml-1">
            <Menu size={22} />
          </button>
          <img src={nawrasMark} alt="" className="h-7 w-auto" />
          <span className="font-bold tracking-tight">NAWRAS</span>
        </div>
        <main className="p-4 lg:p-8 max-w-6xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LaunchPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/master-data" element={<MasterDataPage />} />
        <Route path="/box1" element={<Box1InternalPage />} />
        <Route path="/box2" element={<Box2ExternalPage />} />
        <Route path="/box3" element={<Box3LedgerPage />} />
        <Route path="/box4" element={<Box4ModulesPage />} />
        <Route path="/box5" element={<Box5ReportingPage />} />
        <Route path="/comms" element={<CommunicationsPage />} />
      </Route>
    </Routes>
  )
}

export default App
