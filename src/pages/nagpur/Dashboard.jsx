import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Zap, Clock, Brain, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import API from '../../api'

const API = 'http://localhost:8080/api'

export default function Dashboard() {
  const [crimes, setCrimes] = useState([])
  const [zones, setZones] = useState({})
  const [liveAlerts, setLiveAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [c, z, a] = await Promise.all([
          fetch(`${API}/crimes`).then(r => r.json()),
          fetch(`${API}/analysis/zones`).then(r => r.json()),
          fetch(`${API}/live-crimes/unnotified`).then(r => r.json()),
        ])
        setCrimes(c); setZones(z); setLiveAlerts(a)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchAll()
    const t = setInterval(fetchAll, 60000)
    return () => clearInterval(t)
  }, [])

  const total = crimes.length
  const totalZones = zones.totalZones ?? 0
  const camZones = zones.cameraZones ?? 0
  const kobZones = zones.kobanZones ?? 0
  const patZones = zones.patrolZones ?? 0
  const allZones = zones.zones ?? []
  const openCases = crimes.filter(c => c.status?.toLowerCase() === 'open').length
  const closed = crimes.filter(c => c.status?.toLowerCase() === 'closed').length

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const last7 = crimes.filter(c => c.occurredAt && new Date(c.occurredAt) >= sevenDaysAgo).length

  const topHotspot = allZones.length > 0
    ? allZones.reduce((a, b) => a.crimeCount > b.crimeCount ? a : b)
    : null

  const crimeFreq = crimes.reduce((acc, c) => { acc[c.crimeType] = (acc[c.crimeType] || 0) + 1; return acc }, {})
  const dominantType = Object.entries(crimeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'

  const hourFreq = crimes.reduce((acc, c) => {
    if (c.occurredAt) { const h = new Date(c.occurredAt).getHours(); acc[h] = (acc[h] || 0) + 1 }
    return acc
  }, {})
  const peakHour = Object.entries(hourFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '20'

  const sMap = { KOBAN: 10, CAMERA: 6, PATROL: 4 }
  const avgSev = allZones.length > 0
    ? (allZones.reduce((s, z) => s + (sMap[z.zoneType] ?? 5), 0) / allZones.length).toFixed(1)
    : '0.0'

  return (
    <div className="px-8 py-7 space-y-6">

      {/* ── Page title ── */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-sm font-semibold text-white tracking-wide">Dashboard</h1>
        <p className="text-xs text-zinc-600 mt-0.5">Nagpur crime intelligence overview</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value: total, label: 'Total Incidents', sub: 'All time', delta: null },
          { value: openCases, label: 'Open Cases', sub: 'Awaiting action', delta: null },
          { value: closed, label: 'Closed Cases', sub: 'Resolved', delta: null },
          { value: last7, label: 'Last 7 Days', sub: 'Recent activity', delta: null },
        ].map(card => (
          <div key={card.label}
            className="bg-[#141414] border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
            <div className="text-2xl font-semibold text-white tabular-nums">{card.value}</div>
            <div className="text-xs font-medium text-zinc-400 mt-2">{card.label}</div>
            <div className="text-xs text-zinc-600 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Quick Nav Tiles ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Spatial Map', sub: 'Crime clusters & zones', id: 'map', accent: '#3b82f6', badge: totalZones > 0 ? totalZones : null },
          { label: 'AI Insights', sub: 'Pattern analysis & alerts', id: 'insights', accent: '#f59e0b', badge: liveAlerts.length > 0 ? liveAlerts.length : null },
          { label: 'Statistics', sub: 'Charts & incident table', id: 'statistics', accent: '#a855f7', badge: null },
        ].map(tile => (
          <button key={tile.id}
            onClick={() => navigate(`/nagpur/${tile.id}`)}
            className="bg-[#141414] border border-zinc-800 rounded-lg p-5 text-left hover:border-zinc-700 transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-lg" style={{ background: tile.accent }} />
            {tile.badge && (
              <div className="absolute top-3 right-3 text-xs px-1.5 py-0.5 rounded font-mono text-white"
                style={{ background: tile.accent }}>
                {tile.badge}
              </div>
            )}
            <div className="text-sm font-medium text-white mt-1 group-hover:text-blue-400 transition-colors">{tile.label}</div>
            <div className="text-xs text-zinc-600 mt-1">{tile.sub}</div>
          </button>
        ))}
      </div>

      {/* ── Top Hotspot + Activity Pattern ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Top Hotspot */}
        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Top Hotspot</div>

          {topHotspot ? (
            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold text-white">{topHotspot.zoneType} Zone</div>
                <div className="text-xs text-zinc-600 font-mono mt-0.5">
                  {topHotspot.centerLat?.toFixed(5)}, {topHotspot.centerLng?.toFixed(5)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: topHotspot.crimeCount, label: 'Incidents' },
                  { val: `${Math.round(topHotspot.radiusMeters)}m`, label: 'Radius' },
                  { val: topHotspot.dominantCrime, label: 'Type' },
                ].map(item => (
                  <div key={item.label} className="bg-[#0f0f0f] rounded p-3 border border-zinc-800">
                    <div className="text-sm font-semibold text-white capitalize truncate">{item.val}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
              <button className="text-xs text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1 transition-colors">
                View on map <ArrowRight size={11} />
              </button>
            </div>
          ) : (
            <div className="text-xs text-zinc-600">No data. Run analysis first.</div>
          )}
        </div>

        {/* Activity Pattern */}
        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Activity Pattern</div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#0f0f0f] rounded p-4 border border-zinc-800">
              <div className="text-xs text-zinc-600 mb-2">Peak Hour</div>
              <div className="text-2xl font-semibold text-white tabular-nums">
                {String(peakHour).padStart(2, '0')}:00
              </div>
              <div className="mt-3 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(parseInt(peakHour) / 24) * 100}%` }} />
              </div>
            </div>
            <div className="bg-[#0f0f0f] rounded p-4 border border-zinc-800">
              <div className="text-xs text-zinc-600 mb-2">Avg Severity</div>
              <div className="text-2xl font-semibold text-white">
                {avgSev}<span className="text-sm text-zinc-600">/10</span>
              </div>
              <div className="mt-3 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-700"
                  style={{ width: `${(parseFloat(avgSev) / 10) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Camera Zones', count: camZones },
              { label: 'Koban Zones', count: kobZones },
              { label: 'Patrol Zones', count: patZones },
            ].map(z => (
              <div key={z.label} className="flex items-center gap-3">
                <div className="text-xs text-zinc-600 w-24">{z.label}</div>
                <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-500 rounded-full transition-all duration-700"
                    style={{ width: `${(z.count / (totalZones || 1)) * 100}%` }} />
                </div>
                <div className="text-xs text-zinc-500 w-4 text-right tabular-nums">{z.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-400 tracking-wide">Live Alerts</span>
            {liveAlerts.length > 0 && (
              <span className="text-xs text-zinc-600 tabular-nums">{liveAlerts.length} active</span>
            )}
          </div>
          <button className="text-xs text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1 transition-colors">
            View all <ArrowRight size={11} />
          </button>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {liveAlerts.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-zinc-700">
              No active alerts
            </div>
          ) : liveAlerts.slice(0, 5).map(alert => {
            const isHigh = alert.crimeType?.toLowerCase().match(/(assault|rape|murder|lynching|kidnap|robbery)/)
            return (
              <div key={alert.id} className="px-5 py-3.5 flex items-start gap-4 hover:bg-zinc-900/30 transition-colors">
                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isHigh ? 'bg-red-500' : 'bg-zinc-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-300 capitalize">{alert.crimeType}</div>
                  <div className="text-xs text-zinc-600 mt-0.5 truncate">{alert.description}</div>
                </div>
                <div className="text-xs text-zinc-700 flex-shrink-0 tabular-nums">
                  {alert.occurredAt ? new Date(alert.occurredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Brain size={11} />
            Dominant: <span className="text-zinc-400 capitalize ml-1">{dominantType}</span>
          </div>
          <button className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors">
            Full report →
          </button>
        </div>
      </div>

    </div>
  )
}