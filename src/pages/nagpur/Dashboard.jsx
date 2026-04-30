import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, Zap, Clock, Brain, ArrowRight } from 'lucide-react'
import API from '../../api'

export default function Dashboard() {
  const [crimes, setCrimes]     = useState([])
  const [zones, setZones]       = useState({})
  const [liveAlerts, setLiveAlerts] = useState([])

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
    }
    fetchAll()
    const t = setInterval(fetchAll, 60000)
    return () => clearInterval(t)
  }, [])

  const total      = crimes.length
  const totalZones = zones.totalZones ?? 0
  const camZones   = zones.cameraZones ?? 0
  const kobZones   = zones.kobanZones ?? 0
  const patZones   = zones.patrolZones ?? 0
  const allZones   = zones.zones ?? []
  const openCases  = crimes.filter(c => c.status?.toLowerCase() === 'open').length
  const closed     = crimes.filter(c => c.status?.toLowerCase() === 'closed').length

  const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000)
  const last7        = crimes.filter(c => c.occurredAt && new Date(c.occurredAt) >= sevenDaysAgo).length

  const topHotspot = allZones.length > 0
    ? allZones.reduce((a,b) => a.crimeCount > b.crimeCount ? a : b)
    : null

  const crimeFreq    = crimes.reduce((acc,c) => { acc[c.crimeType]=(acc[c.crimeType]||0)+1; return acc }, {})
  const dominantType = Object.entries(crimeFreq).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? 'N/A'

  const hourFreq = crimes.reduce((acc,c) => {
    if(c.occurredAt){const h=new Date(c.occurredAt).getHours();acc[h]=(acc[h]||0)+1}
    return acc
  }, {})
  const peakHour = Object.entries(hourFreq).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '20'

  const sMap   = {KOBAN:10,CAMERA:6,PATROL:4}
  const avgSev = allZones.length > 0
    ? (allZones.reduce((s,z)=>s+(sMap[z.zoneType]??5),0)/allZones.length).toFixed(1)
    : '0.0'

  return (
    <div className="px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-5">

      {/* Page title */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-sm font-semibold text-white tracking-wide">Dashboard</h1>
        <p className="text-xs text-zinc-600 mt-0.5">Nagpur crime intelligence overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value:total,     label:'Total Incidents', sub:'All recorded crimes' },
          { value:openCases, label:'Open Cases',      sub:'Awaiting resolution' },
          { value:closed,    label:'Closed Cases',    sub:'Resolved incidents' },
          { value:last7,     label:'Last 7 Days',     sub:'Recent activity' },
        ].map(card => (
          <div key={card.label}
            className="bg-[#141414] border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
            <div className="text-2xl font-semibold text-white tabular-nums">{card.value}</div>
            <div className="text-xs font-medium text-zinc-400 mt-1">{card.label}</div>
            <div className="text-xs text-zinc-600 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Top Hotspot + Activity Pattern */}
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
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val:topHotspot.crimeCount,                     label:'Incidents' },
                  { val:`${Math.round(topHotspot.radiusMeters)}m`, label:'Radius' },
                  { val:topHotspot.dominantCrime,                  label:'Type' },
                ].map(item => (
                  <div key={item.label} className="bg-[#0f0f0f] rounded p-2.5 border border-zinc-800">
                    <div className="text-xs font-semibold text-white capitalize truncate">{item.val}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-600">No data. Run analysis first.</div>
          )}
        </div>

        {/* Activity Pattern */}
        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Activity Pattern</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#0f0f0f] rounded p-3 border border-zinc-800">
              <div className="text-xs text-zinc-600 mb-1">Peak Hour</div>
              <div className="text-xl font-semibold text-white tabular-nums">
                {String(peakHour).padStart(2,'0')}:00
              </div>
              <div className="mt-2 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full"
                  style={{width:`${(parseInt(peakHour)/24)*100}%`}} />
              </div>
            </div>
            <div className="bg-[#0f0f0f] rounded p-3 border border-zinc-800">
              <div className="text-xs text-zinc-600 mb-1">Avg Severity</div>
              <div className="text-xl font-semibold text-white">
                {avgSev}<span className="text-xs text-zinc-600">/10</span>
              </div>
              <div className="mt-2 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full"
                  style={{width:`${(parseFloat(avgSev)/10)*100}%`}} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              {label:'Camera',count:camZones},
              {label:'Koban', count:kobZones},
              {label:'Patrol',count:patZones},
            ].map(z => (
              <div key={z.label} className="flex items-center gap-3">
                <div className="text-xs text-zinc-600 w-14">{z.label}</div>
                <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-500 rounded-full"
                    style={{width:`${(z.count/(totalZones||1))*100}%`}} />
                </div>
                <div className="text-xs text-zinc-500 w-4 text-right">{z.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between px-4 md:px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-400 tracking-wide">Live Alerts</span>
            {liveAlerts.length > 0 && (
              <span className="text-xs text-zinc-600">{liveAlerts.length} active</span>
            )}
          </div>
          <button className="text-xs text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1">
            View all <ArrowRight size={11} />
          </button>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {liveAlerts.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-zinc-700">No active alerts</div>
          ) : liveAlerts.slice(0,5).map(alert => {
            const isHigh = alert.crimeType?.toLowerCase().match(/(assault|rape|murder|lynching|kidnap|robbery)/)
            return (
              <div key={alert.id} className="px-4 md:px-5 py-3.5 flex items-start gap-3 hover:bg-zinc-900/30">
                <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isHigh?'bg-red-500':'bg-zinc-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-300 capitalize">{alert.crimeType}</div>
                  <div className="text-xs text-zinc-600 mt-0.5 truncate">{alert.description}</div>
                  {alert.jurisdictionName && (
                    <div className="text-xs text-blue-500/70 mt-0.5">{alert.jurisdictionName}</div>
                  )}
                </div>
                <div className="text-xs text-zinc-700 flex-shrink-0 tabular-nums">
                  {alert.occurredAt ? new Date(alert.occurredAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : ''}
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-4 md:px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Brain size={11} />
            Dominant: <span className="text-zinc-400 capitalize ml-1">{dominantType}</span>
          </div>
        </div>
      </div>
    </div>
  )
}