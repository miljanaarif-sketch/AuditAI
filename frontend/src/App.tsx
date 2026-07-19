import { Routes, Route, Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import LaunchPage from './pages/LaunchPage'
import DashboardPage from './pages/DashboardPage'
import MasterDataPage from './pages/MasterDataPage'
import Box1InternalPage from './pages/Box1InternalPage'
import Box2ExternalPage from './pages/Box2ExternalPage'
import Box3LedgerPage from './pages/Box3LedgerPage'
import Box4ModulesPage from './pages/Box4ModulesPage'
import Box5ReportingPage from './pages/Box5ReportingPage'
import AnnexureChecklistPage from './pages/AnnexureChecklistPage'
import CommunicationsPage from './pages/CommunicationsPage'

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 max-w-6xl">
        <Outlet />
      </main>
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
        <Route path="/annexure" element={<AnnexureChecklistPage />} />
        <Route path="/comms" element={<CommunicationsPage />} />
      </Route>
    </Routes>
  )
}

export default App
