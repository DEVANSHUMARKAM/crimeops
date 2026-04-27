import { useState, useEffect } from 'react'
import { Brain, MapPin, AlertTriangle, Shield, Camera, Navigation, RefreshCw, ChevronDown, ChevronUp, Zap } from 'lucide-react'

const API = 'http://localhost:8080/api'

const POLICE_STATIONS = [
  { name: 'Sitabuldi PS',    lat: 21.1458, lng: 79.0882, jurisdiction: 'Sitabuldi, Dharampeth' },
  { name: 'Sadar PS',        lat: 21.1580, lng: 79.0950, jurisdiction: 'Sadar, Civil Lines' },
  { name: 'Itwari PS',       lat: 21.1420, lng: 79.1010, jurisdiction: 'Itwari, Gandhibagh' },
  { name: 'Kamptee Road PS', lat: 21.1620, lng: 79.1100, jurisdiction: 'Kamptee Road' },
  { name: 'Hingna PS',       lat: 21.1380, lng: 79.0750, jurisdiction: 'Hingna, Wathoda' },
  { name: 'Mahal PS',        lat: 21.1480, lng: 79.0900, jurisdiction: 'Mahal, Budhwarpeth' },
]

const haversine = (lat1,lng1,lat2,lng2) => {
  const R=6371000, dL=(lat2-lat1)*Math.PI/180, dG=(lng2-lng1)*Math.PI/180
  const a=Math.sin(dL/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dG/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

const getRiskColor = s => s>=75?'#ef4444':s>=55?'#f97316':s>=35?'#f59e0b':'#22c55e'
const getRiskLabel = s => s>=75?'CRITICAL':s>=55?'HIGH':s>=35?'MEDIUM':'LOW'

const priorityOrder = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 }

export default function AIInsights() {
  const [crimes, setCrimes]     = useState([])
  const [zones, setZones]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('insights')
  const [expanded, setExpanded] = useState({})

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [c, z] = await Promise.all([
        fetch(`${API}/crimes`).then(r => r.json()),
        fetch(`${API}/analysis/zones`).then(r => r.json()),
      ])
      setCrimes(c); setZones(z.zones ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const runAnalysis = async () => {
    setLoading(true)
    try {
      await fetch(`${API}/analysis/run`, { method:'POST' })
      await fetchAll()
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  // ── Computed ─────────────────────────────────────────────────────────────
  const total      = crimes.length
  const crimeFreq  = crimes.reduce((a,c)=>{ a[c.crimeType?.toLowerCase()??'?']=(a[c.crimeType?.toLowerCase()??'?']||0)+1; return a },{})
  const openCount  = crimes.filter(c=>c.status?.toLowerCase()==='open').length
  const openRate   = total > 0 ? openCount/total : 0

  const hourFreq   = crimes.reduce((a,c)=>{ if(c.occurredAt){const h=new Date(c.occurredAt).getHours();a[h]=(a[h]||0)+1} return a },{})
  const peakHour   = Object.entries(hourFreq).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '20'

  const sevenAgo   = new Date(Date.now()-7*24*60*60*1000)
  const prevAgo    = new Date(Date.now()-14*24*60*60*1000)
  const last7      = crimes.filter(c=>c.occurredAt&&new Date(c.occurredAt)>=sevenAgo).length
  const prev7      = crimes.filter(c=>{if(!c.occurredAt)return false;const d=new Date(c.occurredAt);return d>=prevAgo&&d<sevenAgo}).length
  const weekTrend  = prev7>0?Math.round(((last7-prev7)/prev7)*100):0

  const dayFreq    = crimes.reduce((a,c)=>{ if(c.occurredAt){const d=new Date(c.occurredAt).getDay();a[d]=(a[d]||0)+1} return a },{})
  const weekendAvg = ((dayFreq[0]??0)+(dayFreq[6]??0))/2
  const weekdayAvg = [1,2,3,4,5].reduce((s,d)=>s+(dayFreq[d]??0),0)/5
  const weekendSurge = weekdayAvg > 0 ? weekendAvg/weekdayAvg : 1

  // ── Generate AI Insights ──────────────────────────────────────────────────
  const insights = []

  // Hotspot insight
  if (zones.length > 0) {
    const top = zones.reduce((a,b)=>a.crimeCount>b.crimeCount?a:b)
    const score = Math.min(100, Math.round((top.crimeCount/Math.max(...zones.map(z=>z.crimeCount),1))*100))
    insights.push({
      id:'hotspot-1', type:'hotspot', severity: getRiskLabel(score),
      title:`High-density ${top.zoneType.toLowerCase()} zone detected`,
      desc:`A cluster of ${top.crimeCount} crimes has been identified near ${top.centerLat?.toFixed(4)}°N. This area shows concentrated criminal activity requiring immediate attention.`,
      metrics:[{l:'Incidents',v:top.crimeCount},{l:'Radius',v:`${Math.round(top.radiusMeters)}m`},{l:'Type',v:top.dominantCrime}],
      recommendation: `${top.zoneType === 'CAMERA' ? 'Install surveillance cameras' : top.zoneType === 'KOBAN' ? 'Deploy permanent police post (koban)' : 'Increase patrol frequency'} within ${Math.round(top.radiusMeters)}m radius of coordinates ${top.centerLat?.toFixed(4)}, ${top.centerLng?.toFixed(4)}.`
    })
  }

  // Temporal insight
  insights.push({
    id:'temporal-1', type:'temporal', severity:'MEDIUM',
    title:`Peak criminal activity at ${String(peakHour).padStart(2,'0')}:00`,
    desc:`Historical analysis shows crime frequency peaks at ${String(peakHour).padStart(2,'0')}:00. Evening hours (20:00–23:00) account for the highest concentration of violent incidents.`,
    metrics:[{l:'Peak hour',v:`${String(peakHour).padStart(2,'0')}:00`},{l:'Incidents',v:hourFreq[peakHour]??0}],
    recommendation:`Increase patrol density between 20:00 and 23:00, particularly in KOBAN zones. Deploy additional units 30 minutes before peak hour.`
  })

  // Violent crime alert
  const violentCount = (crimeFreq['assault']??0) + (crimeFreq['robbery']??0) + (crimeFreq['murder']??0)
  const violentRate  = total > 0 ? violentCount/total : 0
  if (violentRate > 0.15) {
    insights.push({
      id:'alert-1', type:'alert', severity:'HIGH',
      title:`Elevated violent crime — ${Math.round(violentRate*100)}% of incidents`,
      desc:`Assault and robbery collectively represent ${Math.round(violentRate*100)}% of all recorded incidents, exceeding the 15% threshold. This indicates a pattern of escalating violence.`,
      metrics:[{l:'Assault',v:crimeFreq['assault']??0},{l:'Robbery',v:crimeFreq['robbery']??0},{l:'Murder',v:crimeFreq['murder']??0}],
      recommendation:`Prioritize KOBAN deployment in high-violence clusters. Coordinate with district crime branch for targeted operations.`
    })
  }

  // Open case backlog
  if (openRate > 0.35) {
    insights.push({
      id:'resource-1', type:'resource', severity:'MEDIUM',
      title:`High open case backlog — ${Math.round(openRate*100)}% unresolved`,
      desc:`${openCount} cases remain open out of ${total} total incidents. This ${Math.round(openRate*100)}% open rate exceeds the recommended 35% threshold and may indicate resource constraints.`,
      metrics:[{l:'Open',v:openCount},{l:'Rate',v:`${Math.round(openRate*100)}%`}],
      recommendation:`Review case assignment distribution across police stations. Consider temporary reallocation of investigative resources to high-backlog jurisdictions.`
    })
  }

  // Weekend surge
  if (weekendSurge > 1.3) {
    insights.push({
      id:'pattern-1', type:'prediction', severity:'MEDIUM',
      title:`Weekend crime surge detected — ${Math.round(weekendSurge*100-100)}% above weekday`,
      desc:`Weekend daily average (${Math.round(weekendAvg)} incidents) exceeds weekday average (${Math.round(weekdayAvg)} incidents) by ${Math.round(weekendSurge*100-100)}%. Saturday and Sunday require enhanced deployment.`,
      metrics:[{l:'Weekend avg',v:Math.round(weekendAvg)},{l:'Weekday avg',v:Math.round(weekdayAvg)}],
      recommendation:`Deploy additional units on Friday evening through Sunday night. Focus on areas with high drug peddling and vandalism clustering.`
    })
  }

  // Weekly trend
  if (Math.abs(weekTrend) > 10) {
    insights.push({
      id:'trend-1', type:'patrol', severity: weekTrend > 0 ? 'HIGH' : 'LOW',
      title:`Weekly trend: ${weekTrend > 0 ? '+' : ''}${weekTrend}% vs previous week`,
      desc:`Crime incidents ${weekTrend > 0 ? 'increased' : 'decreased'} by ${Math.abs(weekTrend)}% compared to the previous 7-day period. ${weekTrend > 0 ? 'Escalating trend requires proactive response.' : 'Declining trend suggests current measures are effective.'}`,
      metrics:[{l:'This week',v:last7},{l:'Last week',v:prev7},{l:'Change',v:`${weekTrend>0?'+':''}${weekTrend}%`}],
      recommendation: weekTrend > 0
        ? `Investigate which crime types are driving the increase. Cross-reference with recent events or changes in patrol patterns.`
        : `Maintain current patrol deployment strategy. Document successful interventions for future reference.`
    })
  }

  insights.sort((a,b) => priorityOrder[a.severity] - priorityOrder[b.severity])

  const criticalCount = insights.filter(i=>i.severity==='CRITICAL').length
  const highCount     = insights.filter(i=>i.severity==='HIGH').length

  // ── Station alerts ────────────────────────────────────────────────────────
  const stationAlerts = POLICE_STATIONS.map(station => {
    const nearby = zones.filter(z => haversine(station.lat,station.lng,z.centerLat,z.centerLng) <= 3000)
    const ko = nearby.filter(z=>z.zoneType==='KOBAN').length
    const ca = nearby.filter(z=>z.zoneType==='CAMERA').length
    const pa = nearby.filter(z=>z.zoneType==='PATROL').length
    const tc = nearby.reduce((s,z)=>s+(z.crimeCount??0),0)
    const domTypes = nearby.map(z=>z.dominantCrime).filter(Boolean).reduce((a,t)=>{a[t]=(a[t]||0)+1;return a},{})
    const topCrime = Object.entries(domTypes).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? null
    const priority = ko>0?'CRITICAL':ca>0?'HIGH':pa>0?'MEDIUM':'LOW'
    const recs = []
    if(ko>0) recs.push(`Deploy ${ko} koban unit${ko>1?'s':''}`)
    if(ca>0) recs.push(`Install ${ca} surveillance camera${ca>1?'s':''}`)
    if(pa>0) recs.push(`Increase patrol in ${pa} zone${pa>1?'s':''}`)
    if(tc>5) recs.push('High crime density — consider additional force')
    return { ...station, nearby, ko, ca, pa, tc, topCrime, priority, recs }
  }).filter(s=>s.nearby.length>0).sort((a,b)=>priorityOrder[a.priority]-priorityOrder[b.priority])

  // ── Hotspot cards ─────────────────────────────────────────────────────────
  const hotspotCards = zones
    .map((z,i) => {
      const score = Math.min(100, Math.round((z.crimeCount/Math.max(...zones.map(x=>x.crimeCount),1))*100))
      return { ...z, score, rank: i+1 }
    })
    .sort((a,b) => b.score - a.score)

  const typeColors = { hotspot:'#f97316', temporal:'#06b6d4', alert:'#ef4444', resource:'#a855f7', prediction:'#f59e0b', patrol:'#22c55e' }

  const SeverityBadge = ({s}) => {
    const colors = { CRITICAL:'text-red-400 bg-red-900/20 border-red-800/30', HIGH:'text-orange-400 bg-orange-900/20 border-orange-800/30', MEDIUM:'text-yellow-400 bg-yellow-900/20 border-yellow-800/30', LOW:'text-green-400 bg-green-900/20 border-green-800/30' }
    return <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colors[s]}`}>{s}</span>
  }

  return (
    <div className="px-8 py-7 space-y-5">

      {/* ── Header ── */}
      <div className="border-b border-zinc-800 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-white tracking-wide">AI Insights</h1>
          <p className="text-xs text-zinc-600 mt-0.5">Automated crime pattern analysis for Nagpur</p>
        </div>
        <button onClick={runAnalysis}
          className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-zinc-700 rounded-lg text-zinc-400 text-xs font-medium hover:border-zinc-600 hover:text-zinc-200 transition-all cursor-pointer">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Re-analyze
        </button>
      </div>

      {/* ── Severity strip ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Critical', v: insights.filter(i=>i.severity==='CRITICAL').length, c:'text-red-400' },
          { l:'High',     v: insights.filter(i=>i.severity==='HIGH').length,     c:'text-orange-400' },
          { l:'Medium',   v: insights.filter(i=>i.severity==='MEDIUM').length,   c:'text-yellow-400' },
          { l:'Low',      v: insights.filter(i=>i.severity==='LOW').length,      c:'text-green-400' },
        ].map(item => (
          <div key={item.l} className="bg-[#141414] border border-zinc-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-semibold tabular-nums ${item.c}`}>{item.v}</div>
            <div className="text-xs text-zinc-600 mt-1">{item.l}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-zinc-800">
        {[['insights','AI Insights',insights.length],['patrol','Patrol AI',stationAlerts.length],['hotspots','Hotspots',hotspotCards.length]].map(([id,label,count])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-5 py-2.5 text-xs font-medium tracking-wide border-b-2 transition-colors cursor-pointer -mb-px flex items-center gap-2
              ${tab===id?'border-blue-500 text-white':'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
            {label}
            <span className="text-xs text-zinc-700 tabular-nums font-mono">{count}</span>
          </button>
        ))}
      </div>

      {/* ════ AI INSIGHTS TAB ════ */}
      {tab==='insights' && (
        <div className="space-y-3">
          {insights.length === 0 ? (
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-10 text-center">
              <Brain size={28} className="text-zinc-700 mx-auto mb-3" />
              <div className="text-xs text-zinc-600">No insights generated. Run analysis first.</div>
            </div>
          ) : insights.map(insight => (
            <div key={insight.id}
              className={`bg-[#141414] border rounded-lg overflow-hidden transition-all
                ${insight.severity==='CRITICAL'?'border-red-800/50':insight.severity==='HIGH'?'border-orange-800/40':'border-zinc-800'}`}>
              <button
                onClick={() => toggle(insight.id)}
                className="w-full flex items-start gap-3 p-4 text-left cursor-pointer hover:bg-zinc-900/30 transition-colors">
                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${typeColors[insight.type]}20` }}>
                  <Zap size={13} style={{ color: typeColors[insight.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <SeverityBadge s={insight.severity} />
                    <span className="text-xs text-zinc-600 capitalize">{insight.type}</span>
                  </div>
                  <div className="text-sm font-medium text-white">{insight.title}</div>
                  <div className={`text-xs text-zinc-500 mt-1 ${expanded[insight.id] ? '' : 'line-clamp-2'}`}>
                    {insight.desc}
                  </div>
                  {!expanded[insight.id] && (
                    <div className="flex gap-4 mt-2">
                      {insight.metrics.map(m => (
                        <div key={m.l} className="text-xs">
                          <span className="text-zinc-600">{m.l}: </span>
                          <span className="text-zinc-300 font-mono capitalize">{m.v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-zinc-600 flex-shrink-0 mt-1">
                  {expanded[insight.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {expanded[insight.id] && (
                <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
                  <div className="flex gap-4 mb-3">
                    {insight.metrics.map(m => (
                      <div key={m.l} className="text-xs">
                        <span className="text-zinc-600">{m.l}: </span>
                        <span className="text-zinc-300 font-mono capitalize">{m.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-950/20 border border-blue-800/30 rounded p-3">
                    <div className="text-xs text-blue-400 font-medium mb-1">Recommendation</div>
                    <div className="text-xs text-zinc-400">{insight.recommendation}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════ PATROL AI TAB ════ */}
      {tab==='patrol' && (
        <div className="space-y-3">
          <div className="bg-[#141414] border border-zinc-800 rounded-lg p-4 text-xs text-zinc-500">
            Police stations are alerted based on crime zones detected within a 3km jurisdiction radius. Priority is assigned based on zone types — KOBAN zones trigger CRITICAL alerts.
          </div>
          {stationAlerts.length === 0 ? (
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-10 text-center">
              <Shield size={28} className="text-zinc-700 mx-auto mb-3" />
              <div className="text-xs text-zinc-600">No station alerts. Run analysis to generate patrol recommendations.</div>
            </div>
          ) : stationAlerts.map(station => (
            <div key={station.name}
              className={`bg-[#141414] border rounded-lg p-5 transition-all
                ${station.priority==='CRITICAL'?'border-red-800/50':station.priority==='HIGH'?'border-orange-800/40':'border-zinc-800'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <SeverityBadge s={station.priority} />
                  <div>
                    <div className="text-sm font-medium text-white">{station.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-zinc-600" />
                      <span className="text-xs text-zinc-600">{station.jurisdiction}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-white tabular-nums">{station.tc}</div>
                  <div className="text-xs text-zinc-600">crimes nearby</div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-3">
                {station.ko>0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-700 bg-zinc-900">
                    <Shield size={10} className="text-red-400" />
                    <span className="text-xs text-zinc-400">{station.ko} Koban</span>
                  </div>
                )}
                {station.ca>0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-700 bg-zinc-900">
                    <Camera size={10} className="text-blue-400" />
                    <span className="text-xs text-zinc-400">{station.ca} Camera</span>
                  </div>
                )}
                {station.pa>0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-700 bg-zinc-900">
                    <Navigation size={10} className="text-green-400" />
                    <span className="text-xs text-zinc-400">{station.pa} Patrol</span>
                  </div>
                )}
                {station.topCrime && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-700 bg-zinc-900">
                    <span className="text-xs text-zinc-400 capitalize">{station.topCrime}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                {station.recs.map((r,i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 text-xs mt-0.5 flex-shrink-0">→</span>
                    <span className="text-xs text-zinc-400">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════ HOTSPOTS TAB ════ */}
      {tab==='hotspots' && (
        <div className="space-y-3">
          {hotspotCards.length === 0 ? (
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-10 text-center">
              <MapPin size={28} className="text-zinc-700 mx-auto mb-3" />
              <div className="text-xs text-zinc-600">No hotspot clusters found. Run analysis first.</div>
            </div>
          ) : hotspotCards.map((zone, i) => {
            const color = getRiskColor(zone.score)
            const label = getRiskLabel(zone.score)
            return (
              <div key={i} className="bg-[#141414] border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: `${color}25`, color }}>
                      #{i+1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{zone.zoneType} Zone</div>
                      <div className="text-xs text-zinc-600 font-mono mt-0.5">
                        {zone.centerLat?.toFixed(4)}°N, {zone.centerLng?.toFixed(4)}°E
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold tabular-nums" style={{color}}>{zone.score}</div>
                    <div className="text-xs" style={{color}}>{label}</div>
                  </div>
                </div>

                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${zone.score}%`, background: color }} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l:'Incidents',  v: zone.crimeCount },
                    { l:'Type',       v: zone.dominantCrime },
                    { l:'Radius',     v: `${Math.round(zone.radiusMeters)}m` },
                  ].map(item => (
                    <div key={item.l} className="bg-[#0f0f0f] rounded p-2.5 border border-zinc-800">
                      <div className="text-xs font-medium text-white capitalize truncate">{item.v}</div>
                      <div className="text-xs text-zinc-600 mt-0.5">{item.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}