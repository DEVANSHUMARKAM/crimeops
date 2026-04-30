import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet'
import { Filter, ChevronDown, Layers } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import API from '../../api'

const CRIME_COLORS = {
  'theft': '#3b82f6', 'burglary': '#6366f1', 'accident': '#f59e0b',
  'assault': '#ef4444', 'murder': '#dc2626', 'robbery': '#f97316',
  'rape': '#be123c', 'kidnapping': '#db2777', 'drug peddling': '#10b981',
  'vandalism': '#84cc16', 'pickpocketing': '#06b6d4', 'mob lynching': '#7c3aed',
}

const ZONE_COLORS = {
  CAMERA: { stroke: '#3b82f6', fill: '#3b82f610' },
  KOBAN:  { stroke: '#ef4444', fill: '#ef444410' },
  PATROL: { stroke: '#22c55e', fill: '#22c55e10' },
}

const getRiskColor = (score) =>
  score >= 75 ? '#ef4444' : score >= 55 ? '#f97316' : score >= 35 ? '#f59e0b' : '#22c55e'

const getRiskLabel = (score) =>
  score >= 75 ? 'CRITICAL' : score >= 55 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW'

function FlyToNagpur() {
  const map = useMap()
  useEffect(() => { map.setView([21.1458, 79.0882], 13) }, [map])
  return null
}

const popupStyle = () => ({
  background: '#141414', color: '#d4d4d8', padding: '12px',
  borderRadius: '8px', minWidth: '180px', fontFamily: 'sans-serif', fontSize: '12px'
})

export default function SpatialMap() {
  const [crimes, setCrimes]           = useState([])
  const [zones, setZones]             = useState([])
  const [activeTab, setActiveTab]     = useState('incidents')
  const [timeRange, setTimeRange]     = useState('all')
  const [filterType, setFilterType]   = useState('all')
  const [showLayers, setShowLayers]   = useState(true)
  const [showFilter, setShowFilter]   = useState(false)
  const [showLeftPanel, setShowLeftPanel] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cr, zr] = await Promise.all([
          fetch(`${API}/crimes`).then(r => r.json()),
          fetch(`${API}/analysis/zones`).then(r => r.json()),
        ])
        setCrimes(cr)
        setZones(zr.zones ?? [])
      } catch (e) { console.error(e) }
    }
    fetchAll()
  }, [])

  const filteredCrimes = (() => {
    let result = crimes
    if (timeRange !== 'all') {
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      result = result.filter(c => c.occurredAt && new Date(c.occurredAt) >= cutoff)
    }
    if (filterType !== 'all') result = result.filter(c => c.crimeType?.toLowerCase() === filterType)
    return result
  })()

  const crimeFreq    = filteredCrimes.reduce((a, c) => { const t = c.crimeType?.toLowerCase()??'?'; a[t]=(a[t]||0)+1; return a }, {})
  const allTypes     = [...new Set(crimes.map(c => c.crimeType?.toLowerCase()).filter(Boolean))]
  const totalZones   = zones.length
  const topRiskZone  = zones.length > 0 ? zones.reduce((a,b) => a.crimeCount > b.crimeCount ? a : b) : null
  const topRiskScore = topRiskZone ? Math.min(100, Math.round((topRiskZone.crimeCount / Math.max(...zones.map(z=>z.crimeCount))) * 100)) : 0
  const openCount    = filteredCrimes.filter(c => c.status?.toLowerCase() === 'open').length
  const closedCount  = filteredCrimes.filter(c => c.status?.toLowerCase() === 'closed').length

  const tabs = ['incidents', 'hotspots', 'prediction', 'patrol']

  const CrimePopup = ({ crime }) => {
    const color = CRIME_COLORS[crime.crimeType?.toLowerCase()] ?? '#94a3b8'
    return (
      <div style={popupStyle()}>
        <div style={{ color, fontWeight:600, fontSize:'13px', textTransform:'capitalize', marginBottom:'6px' }}>
          {crime.crimeType}
        </div>
        {crime.caseNumber && (
          <div style={{ color:'#3b82f6', fontSize:'11px', marginBottom:'4px', fontFamily:'monospace' }}>
            {crime.caseNumber}
          </div>
        )}
        <div style={{ marginBottom:'3px', fontSize:'11px' }}>{crime.description}</div>
        <div style={{ color:'#71717a', fontSize:'11px', marginBottom:'2px' }}>By: {crime.reportedBy}</div>
        <div style={{ color:'#71717a', fontSize:'11px', marginBottom:'6px' }}>{crime.occurredAt?.split('T')[0]}</div>
        {crime.jurisdictionName && (
          <div style={{ color:'#3b82f6', fontSize:'11px', marginBottom:'4px' }}>{crime.jurisdictionName}</div>
        )}
        <span style={{
          background: crime.status?.toLowerCase()==='open' ? '#7f1d1d' : '#14532d',
          color: crime.status?.toLowerCase()==='open' ? '#fca5a5' : '#86efac',
          padding:'2px 8px', borderRadius:'4px', fontSize:'10px'
        }}>
          {crime.status ?? 'open'}
        </span>
      </div>
    )
  }

  return (
    <div className="relative w-full font-sans" style={{ height:'100vh' }}>

      {/* ── Top Tab Bar ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-0.5 md:gap-1 bg-[#0f0f0f]/90 backdrop-blur border border-zinc-700 rounded-full px-1.5 py-1 overflow-x-auto max-w-[70vw] md:max-w-none">
        {tabs.map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer capitalize whitespace-nowrap
              ${activeTab === tab ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Mobile Left Panel Toggle ── */}
      <button
        onClick={() => setShowLeftPanel(!showLeftPanel)}
        className="md:hidden absolute top-14 left-2 z-[1000] flex items-center gap-1.5 px-3 py-1.5 bg-[#0f0f0f]/90 backdrop-blur border border-zinc-700 rounded-lg text-zinc-400 text-xs font-medium">
        <Filter size={11} />
        Filters
      </button>

      {/* ── Left Panel ── */}
      <div className={`absolute z-[1000] w-44 space-y-2 transition-all
        ${showLeftPanel ? 'top-24 left-2' : 'hidden'} md:block md:top-16 md:left-3`}>

        {/* Time Range */}
        <div className="bg-[#0f0f0f]/90 backdrop-blur border border-zinc-700 rounded-lg p-3">
          <div className="text-xs text-zinc-500 mb-2 font-medium">Time Range</div>
          <div className="grid grid-cols-2 gap-1">
            {['24h','7d','30d','all'].map(r => (
              <button key={r}
                onClick={() => setTimeRange(r)}
                className={`py-1 rounded text-xs font-medium transition-all cursor-pointer
                  ${timeRange === r ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Layers */}
        <div className="bg-[#0f0f0f]/90 backdrop-blur border border-zinc-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={12} className="text-zinc-500" />
              <span className="text-xs text-zinc-400 font-medium">Layers</span>
            </div>
            <button
              onClick={() => setShowLayers(!showLayers)}
              className={`w-8 h-4 rounded-full transition-all cursor-pointer relative ${showLayers ? 'bg-blue-600' : 'bg-zinc-700'}`}>
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showLayers ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-[#0f0f0f]/90 backdrop-blur border border-zinc-700 rounded-lg p-3">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center justify-between w-full cursor-pointer">
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-zinc-500" />
              <span className="text-xs text-zinc-400 font-medium">
                Filter {filterType !== 'all' && <span className="text-blue-400">•</span>}
              </span>
            </div>
            <ChevronDown size={12} className={`text-zinc-500 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
          </button>
          {showFilter && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              <button onClick={() => setFilterType('all')}
                className={`w-full text-left text-xs px-2 py-1 rounded cursor-pointer transition-colors
                  ${filterType==='all' ? 'text-blue-400 bg-blue-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                All types
              </button>
              {allTypes.map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`w-full flex items-center gap-2 text-xs px-2 py-1 rounded cursor-pointer transition-colors
                    ${filterType===t ? 'text-blue-400 bg-blue-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: CRIME_COLORS[t] ?? '#52525b' }} />
                  <span className="capitalize truncate">{t}</span>
                  <span className="ml-auto tabular-nums text-zinc-700">{crimeFreq[t]??0}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="absolute top-14 md:top-16 right-2 md:right-3 z-[1000] w-36 md:w-44">
        <div className="bg-[#0f0f0f]/90 backdrop-blur border border-zinc-700 rounded-lg p-2.5 md:p-3 space-y-2.5 md:space-y-3">

          <div>
            <div className="text-xl md:text-2xl font-semibold text-white tabular-nums">{filteredCrimes.length}</div>
            <div className="text-xs text-zinc-600 capitalize">
              {filterType === 'all' ? 'Total incidents' : filterType}
            </div>
          </div>

          <div className="h-px bg-zinc-800" />

          <div>
            <div className="text-xs text-zinc-500 mb-1 font-medium">Hotspots</div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{totalZones} clusters</span>
              {topRiskScore > 0 && (
                <span style={{ color: getRiskColor(topRiskScore) }}>Risk {topRiskScore}</span>
              )}
            </div>
          </div>

          <div className="h-px bg-zinc-800" />

          <div>
            <div className="text-xs text-zinc-500 mb-1 font-medium">Status</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/><span className="text-zinc-400">Open</span></div>
                <span className="text-zinc-300 tabular-nums">{openCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/><span className="text-zinc-400">Closed</span></div>
                <span className="text-zinc-300 tabular-nums">{closedCount}</span>
              </div>
            </div>
          </div>

          {activeTab === 'prediction' && (
            <>
              <div className="h-px bg-zinc-800" />
              <div>
                <div className="text-xs text-zinc-500 mb-1 font-medium">Zones</div>
                {[
                  { t:'CAMERA', c:'#3b82f6' },
                  { t:'KOBAN',  c:'#ef4444' },
                  { t:'PATROL', c:'#22c55e' },
                ].map(z => (
                  <div key={z.t} className="flex justify-between text-xs mb-1">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{background:z.c}} />
                      <span className="text-zinc-400">{z.t}</span>
                    </div>
                    <span className="text-zinc-300 tabular-nums">{zones.filter(zn=>zn.zoneType===z.t).length}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'hotspots' && (
            <>
              <div className="h-px bg-zinc-800" />
              <div>
                <div className="text-xs text-zinc-500 mb-1 font-medium">Risk</div>
                {[['#ef4444','Critical'],['#f97316','High'],['#f59e0b','Medium'],['#22c55e','Low']].map(([c,l])=>(
                  <div key={l} className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{background:c}} />
                    <span className="text-xs text-zinc-600">{l}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Hotspot Detail Panel ── */}
      {selectedZone && (
        <div className="absolute bottom-4 left-2 right-2 md:top-16 md:bottom-auto md:right-52 md:left-auto md:w-60 z-[1000] bg-[#0f0f0f]/95 backdrop-blur border border-zinc-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div>
              <div className="text-xs font-semibold text-white">{selectedZone.zoneType} Zone</div>
              <div className="text-xs text-zinc-600 font-mono mt-0.5">
                {selectedZone.centerLat?.toFixed(4)}, {selectedZone.centerLng?.toFixed(4)}
              </div>
            </div>
            <button onClick={() => setSelectedZone(null)} className="text-zinc-600 hover:text-zinc-300 text-lg leading-none cursor-pointer">×</button>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { v:selectedZone.crimeCount,                     l:'Incidents' },
                { v:`${Math.round(selectedZone.radiusMeters)}m`, l:'Radius' },
                { v:selectedZone.dominantCrime,                  l:'Type' },
              ].map(item => (
                <div key={item.l} className="bg-zinc-900 rounded p-2 text-center border border-zinc-800">
                  <div className="text-xs font-semibold text-white capitalize truncate">{item.v}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">{item.l}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1.5">Risk Level</div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width:`${Math.min(100,(selectedZone.crimeCount/Math.max(...zones.map(z=>z.crimeCount),1))*100)}%`,
                    background:getRiskColor(Math.min(100,Math.round((selectedZone.crimeCount/Math.max(...zones.map(z=>z.crimeCount),1))*100)))
                  }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Map ── */}
      <MapContainer
        center={[21.1458, 79.0882]} zoom={13}
        className="w-full h-full"
        style={{ height:'100vh' }}
        zoomControl={false}>

        <FlyToNagpur />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
          maxZoom={19}
        />

        {/* INCIDENTS */}
        {activeTab === 'incidents' && showLayers && filteredCrimes.map(crime => {
          if (!crime.latitude || !crime.longitude) return null
          const color = CRIME_COLORS[crime.crimeType?.toLowerCase()] ?? '#94a3b8'
          return (
            <CircleMarker key={crime.crimeId}
              center={[crime.latitude, crime.longitude]}
              radius={6}
              pathOptions={{ color:'white', fillColor:color, fillOpacity:crime.status?.toLowerCase()==='closed'?0.3:0.9, weight:1.5 }}>
              <Popup><CrimePopup crime={crime} /></Popup>
            </CircleMarker>
          )
        })}

        {/* HOTSPOTS */}
        {activeTab === 'hotspots' && zones.map((zone, i) => {
          const maxCount = Math.max(...zones.map(z=>z.crimeCount), 1)
          const score  = Math.min(100, Math.round((zone.crimeCount/maxCount)*100))
          const color  = getRiskColor(score)
          const radius = Math.max(300, zone.radiusMeters)
          return (
            <Circle key={i}
              center={[zone.centerLat, zone.centerLng]}
              radius={radius}
              pathOptions={{ color, fillColor:color, fillOpacity:0.12, weight:score>=75?2.5:1.5, dashArray:score<55?'5 4':undefined }}
              eventHandlers={{ click:()=>setSelectedZone(zone) }}>
              <Popup>
                <div style={popupStyle()}>
                  <div style={{color,fontWeight:600,fontSize:'13px',marginBottom:'6px'}}>{getRiskLabel(score)} — {zone.zoneType}</div>
                  <div style={{marginBottom:'3px'}}>Incidents: {zone.crimeCount}</div>
                  <div style={{marginBottom:'3px',textTransform:'capitalize'}}>Dominant: {zone.dominantCrime}</div>
                  <div style={{marginBottom:'3px'}}>Radius: {Math.round(zone.radiusMeters)}m</div>
                  <div style={{color:'#71717a',fontFamily:'monospace',fontSize:'11px',marginTop:'4px'}}>
                    {zone.centerLat?.toFixed(4)}, {zone.centerLng?.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Circle>
          )
        })}

        {/* PREDICTION */}
        {activeTab === 'prediction' && zones.map((zone, i) => {
          const colors = ZONE_COLORS[zone.zoneType] ?? ZONE_COLORS.PATROL
          const label  = zone.zoneType==='CAMERA' ? '📷 Install Camera' : zone.zoneType==='KOBAN' ? '🏢 Deploy Koban' : '🚔 Increase Patrol'
          return (
            <Circle key={i}
              center={[zone.centerLat, zone.centerLng]}
              radius={Math.max(400, zone.radiusMeters*1.2)}
              pathOptions={{ color:colors.stroke, fillColor:colors.stroke, fillOpacity:0.1, weight:2, dashArray:'6 4' }}>
              <Popup>
                <div style={popupStyle()}>
                  <div style={{color:colors.stroke,fontWeight:600,fontSize:'13px',marginBottom:'6px'}}>{label}</div>
                  <div style={{marginBottom:'3px'}}>{zone.crimeCount} crimes detected</div>
                  <div style={{marginBottom:'3px',textTransform:'capitalize'}}>Dominant: {zone.dominantCrime}</div>
                  <div style={{marginBottom:'3px'}}>Coverage: {Math.round(zone.radiusMeters*1.2)}m radius</div>
                  <div style={{color:'#71717a',fontFamily:'monospace',fontSize:'11px',marginTop:'4px'}}>
                    {zone.centerLat?.toFixed(4)}, {zone.centerLng?.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Circle>
          )
        })}

        {/* PATROL */}
        {activeTab === 'patrol' && (
          <>
            {zones.map((zone, i) => {
              const colors = ZONE_COLORS[zone.zoneType] ?? ZONE_COLORS.PATROL
              return (
                <Circle key={i}
                  center={[zone.centerLat, zone.centerLng]}
                  radius={Math.max(300, zone.radiusMeters)}
                  pathOptions={{ color:colors.stroke, fillColor:colors.stroke, fillOpacity:0.08, weight:1.5 }}>
                  <Popup>
                    <div style={popupStyle()}>
                      <div style={{color:colors.stroke,fontWeight:600,fontSize:'13px',marginBottom:'6px'}}>{zone.zoneType} Zone</div>
                      <div style={{marginBottom:'3px'}}>{zone.crimeCount} incidents</div>
                      <div style={{textTransform:'capitalize'}}>Type: {zone.dominantCrime}</div>
                    </div>
                  </Popup>
                </Circle>
              )
            })}
            {showLayers && filteredCrimes.map(crime => {
              if (!crime.latitude || !crime.longitude) return null
              const color = CRIME_COLORS[crime.crimeType?.toLowerCase()] ?? '#94a3b8'
              return (
                <CircleMarker key={crime.crimeId}
                  center={[crime.latitude, crime.longitude]}
                  radius={5}
                  pathOptions={{ color:'white', fillColor:color, fillOpacity:0.7, weight:1 }}>
                  <Popup><CrimePopup crime={crime} /></Popup>
                </CircleMarker>
              )
            })}
          </>
        )}

      </MapContainer>
    </div>
  )
}