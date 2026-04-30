import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Shield, LayoutDashboard, Map, Brain, BarChart2, FileText, AlertTriangle } from 'lucide-react'
import LiveCrimeNotification from '../../components/LiveCrimeNotification'
import API from '../../api'

const API = 'http://localhost:8080/api'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [totalCrimes, setTotalCrimes] = useState(0)
  const [liveAlerts, setLiveAlerts] = useState(0)
  const [zones, setZones] = useState({ cameraZones: 0, kobanZones: 0, patrolZones: 0, totalZones: 0 })

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const [c, z, a] = await Promise.all([
          fetch(`${API}/crimes`).then(r => r.json()),
          fetch(`${API}/analysis/zones`).then(r => r.json()),
          fetch(`${API}/live-crimes/unnotified`).then(r => r.json()),
        ])
        setTotalCrimes(c.length)
        setZones(z)
        setLiveAlerts(a.length)
      } catch (e) { console.error(e) }
    }
    fetch_()
    const t = setInterval(fetch_, 60000)
    return () => clearInterval(t)
  }, [])

  const active = location.pathname.split('/').pop()

  const navItems = [
    { id: 'dashboard',  icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
    { id: 'map',        icon: <Map size={14} />,             label: 'Spatial Map',  badge: zones.totalZones },
    { id: 'insights',   icon: <Brain size={14} />,           label: 'AI Insights',  badge: liveAlerts },
    { id: 'statistics', icon: <BarChart2 size={14} />,       label: 'Statistics' },
    { id: 'report', icon: <FileText size={14} />, label: 'Daily Report' },
    // { id: 'settings',   icon: <Settings size={14} />,        label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-300 font-sans flex">

      {/* ── Sidebar ── */}
      <aside className="w-52 min-h-screen bg-[#0a0a0a] border-r border-zinc-800 flex flex-col fixed left-0 top-0 z-20">

        <div
          onClick={() => navigate('/')}
          className="px-4 py-4 border-b border-zinc-800 flex items-center gap-3 cursor-pointer hover:bg-zinc-900 transition-colors">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
            <Shield size={13} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-widest text-white">CRIMEOPS</div>
            <div className="text-xs text-zinc-600 tracking-wider">Nagpur</div>
          </div>
        </div>

        <div className="mx-3 mt-4 px-3 py-2.5 rounded border border-zinc-800 bg-[#111]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">Live</span>
          </div>
          <div className="text-xs text-zinc-600">{totalCrimes} incidents</div>
        </div>

        {liveAlerts > 0 && (
          <div className="mx-3 mt-2 px-3 py-2 rounded border border-zinc-800 bg-[#111] flex items-center gap-2">
            <AlertTriangle size={11} className="text-zinc-400" />
            <span className="text-xs text-zinc-400">{liveAlerts} unread alerts</span>
          </div>
        )}

        <nav className="flex-1 px-2 mt-5 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => navigate(`/nagpur/${item.id}`)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium tracking-wide transition-all cursor-pointer
                ${active === item.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}>
              <div className="flex items-center gap-2.5">
                {item.icon}{item.label}
              </div>
              {item.badge > 0 && (
                <span className="text-xs text-zinc-500 tabular-nums">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-700 mb-1.5">Zones</div>
          <div className="text-xs text-zinc-500 space-y-1">
            <div className="flex justify-between">
              <span>Camera</span><span>{zones.cameraZones ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Koban</span><span>{zones.kobanZones ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Patrol</span><span>{zones.patrolZones ?? 0}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-52 flex-1 min-h-screen relative">
        <div className="fixed inset-0 ml-52 flex items-center justify-center pointer-events-none z-0">
          <img src="/nagpur-police-logo.png" alt=""
            className="w-80 h-80 object-contain opacity-[0.025] select-none grayscale"
            onError={(e) => e.target.style.display = 'none'} />
        </div>
        <div className="relative z-10">
          <Outlet />
        </div>
        <LiveCrimeNotification />
      </main>
    </div>
  )
}