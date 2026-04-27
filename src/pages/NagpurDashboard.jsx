import { useState, useEffect } from 'react'
import { Shield, LayoutDashboard, Map, Brain, BarChart2, Settings, RefreshCw, AlertTriangle, TrendingUp, Users, Clock, Activity, ChevronRight, Zap } from 'lucide-react'

const API = 'http://localhost:8080/api'

export default function NagpurDashboard() {
  const [crimes, setCrimes] = useState([])
  const [zones, setZones] = useState([])
  const [liveAlerts, setLiveAlerts] = useState([])
  const [lastUpdated, setLastUpdated] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')

  const fetchData = async () => {
    try {
      const [crimesRes, zonesRes, alertsRes] = await Promise.all([
        fetch(`${API}/crimes`),
        fetch(`${API}/analysis/zones`),
        fetch(`${API}/live-crimes/unnotified`)
      ])
      const crimesData = await crimesRes.json()
      const zonesData = await zonesRes.json()
      const alertsData = await alertsRes.json()
      setCrimes(crimesData)
      setZones(zonesData)
      setLiveAlerts(alertsData)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  // ── Computed stats ──────────────────────────────────────────────────────
  const totalIncidents = crimes.length
  const cameraZones = zones.cameraZones ?? 0
  const kobanZones = zones.kobanZones ?? 0
  const patrolZones = zones.patrolZones ?? 0
  const totalZones = zones.totalZones ?? 0
  const allZones = zones.zones ?? []

  // Top hotspot = zone with highest crime count
  const topHotspot = allZones.length > 0
    ? allZones.reduce((a, b) => (a.crimeCount > b.crimeCount ? a : b))
    : null

  // Crime type frequency
  const crimeFreq = crimes.reduce((acc, c) => {
    acc[c.crimeType] = (acc[c.crimeType] || 0) + 1
    return acc
  }, {})
  const dominantCrime = Object.entries(crimeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'

  // Peak hour from crimes
  const hourFreq = crimes.reduce((acc, c) => {
    if (c.occurredAt) {
      const h = new Date(c.occurredAt).getHours()
      acc[h] = (acc[h] || 0) + 1
    }
    return acc
  }, {})
  const peakHour = Object.entries(hourFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '20'
  const peakHourDisplay = `${String(peakHour).padStart(2, '0')}:00`

  // Avg severity (KOBAN=10, CAMERA=6, PATROL=4)
  const severityMap = { KOBAN: 10, CAMERA: 6, PATROL: 4 }
  const avgSeverity = allZones.length > 0
    ? (allZones.reduce((sum, z) => sum + (severityMap[z.zoneType] ?? 5), 0) / allZones.length).toFixed(1)
    : '0.0'

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { id: 'map', icon: <Map size={16} />, label: 'Spatial Map', badge: totalZones },
    { id: 'insights', icon: <Brain size={16} />, label: 'AI Insights', badge: liveAlerts.length },
    { id: 'statistics', icon: <BarChart2 size={16} />, label: 'Statistics' },
    { id: 'settings', icon: <Settings size={16} />, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-black text-white font-mono flex">

      {/* ── Sidebar ── */}
      <aside className="w-60 min-h-screen bg-zinc-950 border-r border-blue-900/30 flex flex-col fixed left-0 top-0 z-20">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-blue-900/30 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-black tracking-widest text-white">CRIMEOPS</div>
            <div className="text-xs text-zinc-600 tracking-widest">NAGPUR · v1.0</div>
          </div>
        </div>

        {/* Live status */}
        <div className="mx-3 mt-4 px-3 py-2 rounded-lg bg-blue-950/30 border border-blue-800/30">
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold tracking-widest mb-1">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            API LIVE
          </div>
          <div className="text-xs text-zinc-400">{totalIncidents} incidents loaded</div>
        </div>

        {/* Alerts indicator */}
        {liveAlerts.length > 0 && (
          <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-red-950/30 border border-red-800/30">
            <div className="flex items-center gap-2 text-xs text-red-400 font-bold tracking-widest">
              <AlertTriangle size={12} />
              {liveAlerts.length} ALERTS ACTIVE
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 mt-6 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs tracking-widest font-bold transition-all duration-150 cursor-pointer
                ${activeSection === item.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}>
              <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </div>
              {item.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 text-xs">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom info */}
        <div className="px-4 py-4 border-t border-blue-900/30 space-y-2">
          <div className="text-xs text-zinc-600 tracking-widest">PATROLS</div>
          <div className="flex gap-2 text-xs">
            <span className="text-blue-400">● CAMERA {cameraZones}</span>
            <span className="text-red-400">● KOBAN {kobanZones}</span>
            <span className="text-green-400">● PATROL {patrolZones}</span>
          </div>
          <div className="text-xs text-zinc-700 tracking-widest mt-2">v1.0.0 · CLASSIFIED</div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="ml-60 flex-1 min-h-screen bg-gradient-to-br from-black via-blue-950/5 to-black">

        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-black/80 backdrop-blur border-b border-blue-900/30">
          <div>
            <h1 className="text-lg font-black tracking-widest text-white">Intelligence Overview</h1>
            <p className="text-xs text-zinc-500 tracking-widest mt-0.5">
              Live crime analysis dashboard
              {lastUpdated && <span className="ml-2 text-zinc-600">Updated {lastUpdated}</span>}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-blue-400 text-xs font-bold tracking-widest transition-all cursor-pointer">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* ── Row 1: 4 Stat Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <Activity size={20} className="text-blue-400" />,
                value: totalIncidents,
                label: 'Total Incidents',
                sub: 'All recorded crimes',
                color: 'text-blue-400',
                border: 'border-blue-800/30',
                bg: 'bg-blue-950/10',
                glow: 'hover:shadow-blue-900/30'
              },
              {
                icon: <AlertTriangle size={20} className="text-red-400" />,
                value: liveAlerts.length,
                label: 'Open Cases',
                sub: 'Unnotified alerts',
                color: 'text-red-400',
                border: 'border-red-800/30',
                bg: 'bg-red-950/10',
                glow: 'hover:shadow-red-900/30'
              },
              {
                icon: <TrendingUp size={20} className="text-green-400" />,
                value: totalZones > 0 ? `${Math.round((patrolZones / totalZones) * 100)}%` : '0%',
                label: 'Resolution Rate',
                sub: 'Patrol coverage',
                color: 'text-green-400',
                border: 'border-green-800/30',
                bg: 'bg-green-950/10',
                glow: 'hover:shadow-green-900/30'
              },
              {
                icon: <TrendingUp size={20} className="text-yellow-400" />,
                value: `+${liveAlerts.length}`,
                label: '7-Day Trend',
                sub: 'vs previous week',
                color: 'text-yellow-400',
                border: 'border-yellow-800/30',
                bg: 'bg-yellow-950/10',
                glow: 'hover:shadow-yellow-900/30'
              },
            ].map((card) => (
              <div key={card.label}
                className={`${card.bg} border ${card.border} rounded-xl p-5 hover:shadow-xl ${card.glow} transition-all duration-300 hover:scale-[1.02] group cursor-default`}>
                <div className="flex items-center justify-between mb-3">
                  {card.icon}
                  <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                </div>
                <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
                <div className="text-sm text-white font-bold mt-1">{card.label}</div>
                <div className="text-xs text-zinc-600 mt-0.5">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Row 2: Top Hotspot + Activity Pattern ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Top Hotspot */}
            <div className="bg-blue-950/10 border border-blue-800/30 rounded-xl p-6 hover:shadow-xl hover:shadow-blue-900/20 transition-all duration-300 hover:border-blue-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs text-zinc-500 tracking-widest font-bold">
                  <Zap size={14} className="text-blue-400" />
                  TOP HOTSPOT
                </div>
                {topHotspot && (
                  <span className="px-2 py-0.5 rounded-full bg-red-900/30 border border-red-800/30 text-red-400 text-xs font-bold">
                    {topHotspot.crimeCount} crimes
                  </span>
                )}
              </div>

              {topHotspot ? (
                <>
                  <div className="text-2xl font-black text-white mb-1">
                    {topHotspot.zoneType} ZONE
                  </div>
                  <div className="text-xs text-zinc-500 mb-4">
                    {topHotspot.centerLat?.toFixed(4)}, {topHotspot.centerLng?.toFixed(4)}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <div className="text-lg font-black text-red-400">{topHotspot.crimeCount}</div>
                      <div className="text-xs text-zinc-600 mt-0.5">incidents</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <div className="text-lg font-black text-blue-400">{Math.round(topHotspot.radiusMeters)}m</div>
                      <div className="text-xs text-zinc-600 mt-0.5">radius</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <div className="text-xs font-black text-yellow-400 mt-1">{topHotspot.dominantCrime?.toUpperCase()}</div>
                      <div className="text-xs text-zinc-600 mt-0.5">dominant</div>
                    </div>
                  </div>
                  <button className="mt-4 text-xs text-blue-400 hover:text-blue-300 tracking-widest font-bold transition-colors">
                    VIEW ON MAP →
                  </button>
                </>
              ) : (
                <div className="text-zinc-600 text-sm">No hotspot data. Run analysis first.</div>
              )}
            </div>

            {/* Activity Pattern */}
            <div className="bg-zinc-950/40 border border-zinc-800/40 rounded-xl p-6 hover:shadow-xl hover:shadow-zinc-900/30 transition-all duration-300 hover:border-zinc-700/50">
              <div className="flex items-center gap-2 text-xs text-zinc-500 tracking-widest font-bold mb-4">
                <Clock size={14} className="text-yellow-400" />
                ACTIVITY PATTERN
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Peak Hour */}
                <div className="bg-black/40 rounded-xl p-4 border border-zinc-800/30 hover:border-yellow-800/30 transition-colors">
                  <div className="text-xs text-zinc-600 tracking-widest mb-2">PEAK HOUR</div>
                  <div className="text-4xl font-black text-yellow-400">{peakHourDisplay}</div>
                  <div className="text-xs text-zinc-600 mt-2">most active time</div>
                  <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(parseInt(peakHour) / 24) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Avg Severity */}
                <div className="bg-black/40 rounded-xl p-4 border border-zinc-800/30 hover:border-red-800/30 transition-colors">
                  <div className="text-xs text-zinc-600 tracking-widest mb-2">AVG SEVERITY</div>
                  <div className="text-4xl font-black text-white">
                    {avgSeverity}
                    <span className="text-lg text-zinc-600">/10</span>
                  </div>
                  <div className="text-xs text-zinc-600 mt-2">across all zones</div>
                  <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(parseFloat(avgSeverity) / 10) * 100}%`,
                        background: parseFloat(avgSeverity) > 7
                          ? '#ef4444'
                          : parseFloat(avgSeverity) > 5
                            ? '#eab308'
                            : '#22c55e'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Zone breakdown */}
              <div className="mt-4 space-y-2">
                {[
                  { label: 'Camera Zones', count: cameraZones, color: 'bg-blue-500', max: totalZones || 1 },
                  { label: 'Koban Zones', count: kobanZones, color: 'bg-red-500', max: totalZones || 1 },
                  { label: 'Patrol Zones', count: patrolZones, color: 'bg-green-500', max: totalZones || 1 },
                ].map(z => (
                  <div key={z.label} className="flex items-center gap-3">
                    <div className="text-xs text-zinc-600 w-24 tracking-widest">{z.label}</div>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${z.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${(z.count / z.max) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-zinc-400 w-4">{z.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 3: Critical & High Alerts ── */}
          <div className="bg-zinc-950/40 border border-zinc-800/40 rounded-xl overflow-hidden hover:border-zinc-700/50 transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/40">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-yellow-400" />
                <span className="text-sm font-black text-white tracking-widest">CRITICAL & HIGH ALERTS</span>
                {liveAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-900/30 border border-red-800/30 text-red-400 text-xs font-bold">
                    {liveAlerts.length} active
                  </span>
                )}
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300 tracking-widest font-bold transition-colors">
                VIEW ALL {liveAlerts.length} →
              </button>
            </div>

            <div className="divide-y divide-zinc-800/40">
              {liveAlerts.length === 0 ? (
                <div className="px-6 py-8 text-center text-zinc-600 text-sm">
                  No active alerts. System monitoring...
                </div>
              ) : (
                liveAlerts.slice(0, 4).map((alert, i) => {
                  const category = alert.crimeType?.toLowerCase().match(/(assault|rape|murder|lynching|kidnap|robbery)/) ? 'CRITICAL' : 'HIGH'
                  return (
                    <div key={alert.id}
                      className="px-6 py-4 flex items-start gap-4 hover:bg-zinc-900/30 transition-colors group">
                      <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-black tracking-widest flex-shrink-0
                        ${category === 'CRITICAL'
                          ? 'bg-red-900/40 text-red-400 border border-red-800/40'
                          : 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/40'}`}>
                        {category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white capitalize">
                          {alert.crimeType} detected
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5 truncate">
                          {alert.description} · {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-600 flex-shrink-0">
                        {alert.occurredAt ? new Date(alert.occurredAt).toLocaleTimeString() : ''}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* AI Insight preview footer */}
            <div className="px-6 py-3 bg-blue-950/10 border-t border-blue-900/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Brain size={13} className="text-blue-400" />
                AI analysis: dominant crime is
                <span className="text-white font-bold capitalize"> {dominantCrime}</span>
                across Nagpur
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300 font-bold tracking-widest transition-colors">
                FULL AI REPORT →
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}