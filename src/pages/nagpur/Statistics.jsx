import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import API from '../../api'



const CRIME_COLORS = {
  'theft': '#3b82f6', 'burglary': '#6366f1', 'accident': '#f59e0b',
  'assault': '#ef4444', 'murder': '#dc2626', 'robbery': '#f97316',
  'rape': '#be123c', 'kidnapping': '#db2777', 'drug peddling': '#10b981',
  'vandalism': '#84cc16', 'pickpocketing': '#06b6d4', 'mob lynching': '#7c3aed',
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const TT = {
  contentStyle: { background:'#111', border:'1px solid #27272a', borderRadius:6, fontSize:11, color:'#a1a1aa' },
  cursor: { fill: '#ffffff08' }
}

export default function Statistics() {
  const [crimes, setCrimes]   = useState([])
  const [zones, setZones]     = useState({})
  const [tab, setTab]         = useState('overview')
  const [search, setSearch]   = useState('')
  const [fType, setFType]     = useState('all')
  const [fStatus, setFStatus] = useState('all')
  const [page, setPage]       = useState(1)
  const PER = 15

  useEffect(() => {
    Promise.all([
      fetch(`${API}/crimes`).then(r => r.json()),
      fetch(`${API}/analysis/zones`).then(r => r.json()),
    ]).then(([c, z]) => { setCrimes(c); setZones(z) }).catch(console.error)
  }, [])

  const total    = crimes.length
  const open     = crimes.filter(c => c.status?.toLowerCase() === 'open').length
  const closed   = crimes.filter(c => c.status?.toLowerCase() === 'closed').length
  const allZones = zones.zones ?? []

  const sevenAgo = new Date(Date.now() - 7*24*60*60*1000)
  const prevAgo  = new Date(Date.now() - 14*24*60*60*1000)
  const last7    = crimes.filter(c => c.occurredAt && new Date(c.occurredAt) >= sevenAgo).length
  const prev7    = crimes.filter(c => { if(!c.occurredAt) return false; const d=new Date(c.occurredAt); return d>=prevAgo && d<sevenAgo }).length
  const trend    = prev7 > 0 ? Math.round(((last7-prev7)/prev7)*100) : 0

  const crimeFreq = crimes.reduce((a,c)=>{ a[c.crimeType?.toLowerCase()??'?']=(a[c.crimeType?.toLowerCase()??'?']||0)+1; return a },{})
  const barData   = Object.entries(crimeFreq).sort((a,b)=>b[1]-a[1]).map(([n,v])=>({ name:n, value:v, fill: CRIME_COLORS[n]??'#52525b' }))
  const radarData = Object.entries(crimeFreq).slice(0,7).map(([s,v])=>({ subject:s, value:v }))

  const sMap   = { KOBAN:10, CAMERA:6, PATROL:4 }
  const avgSev = allZones.length > 0 ? (allZones.reduce((s,z)=>s+(sMap[z.zoneType]??5),0)/allZones.length).toFixed(1) : '0.0'

  const hourData  = Array.from({length:24},(_,h)=>({ hour:`${String(h).padStart(2,'0')}`, count: crimes.filter(c=>c.occurredAt&&new Date(c.occurredAt).getHours()===h).length }))
  const dayData   = DAYS.map((d,i)=>({ day:d, count:crimes.filter(c=>c.occurredAt&&new Date(c.occurredAt).getDay()===i).length, w:i===0||i===6 }))
  const trend30   = Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(29-i)); return { date:`${d.getMonth()+1}/${d.getDate()}`, count:crimes.filter(c=>c.occurredAt&&new Date(c.occurredAt).toDateString()===d.toDateString()).length }})

  const peakH = hourData.reduce((a,b)=>a.count>b.count?a:b,{hour:'00',count:0})
  const peakD = dayData.reduce((a,b)=>a.count>b.count?a:b,{day:'Mon',count:0})

  const filtered = crimes.filter(c=>{
    const s = search.toLowerCase()
    const m = !s || [c.caseNumber,c.crimeType,c.description,c.reportedBy].some(f=>f?.toLowerCase().includes(s))
    return m && (fType==='all'||c.crimeType?.toLowerCase()===fType) && (fStatus==='all'||c.status?.toLowerCase()===fStatus)
  }).sort((a,b)=>new Date(b.occurredAt)-new Date(a.occurredAt))

  const pages = Math.ceil(filtered.length/PER)
  const rows  = filtered.slice((page-1)*PER, page*PER)
  const types = [...new Set(crimes.map(c=>c.crimeType?.toLowerCase()).filter(Boolean))]

  const exportCSV = () => {
    const csv = [['Case','Type','Status','Description','By','Date'],...filtered.map(c=>[c.caseNumber,c.crimeType,c.status,c.description,c.reportedBy,c.occurredAt?.split('T')[0]])].map(r=>r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'crimes.csv'})
    a.click()
  }

  const Label = ({k,v,s}) => (
    <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
      <div className="text-2xl font-semibold text-white tabular-nums">{v}</div>
      <div className="text-xs font-medium text-zinc-400 mt-2">{k}</div>
      <div className="text-xs text-zinc-600 mt-0.5">{s}</div>
    </div>
  )

  return (
    <div className="px-8 py-7 space-y-5">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-sm font-semibold text-white tracking-wide">Statistics</h1>
        <p className="text-xs text-zinc-600 mt-0.5">{total} incidents · {allZones.length} clusters</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {[['overview','Overview'],['temporal','Temporal'],['incidents','Incidents']].map(([id,label])=>(
          <button key={id} onClick={()=>{setTab(id);setPage(1)}}
            className={`px-5 py-2.5 text-xs font-medium tracking-wide border-b-2 transition-colors cursor-pointer -mb-px
              ${tab===id ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Label k="Total" v={total} s="All incidents" />
            <Label k="Open" v={open} s={`${Math.round(open/(total||1)*100)}% rate`} />
            <Label k="Resolution" v={`${Math.round(closed/(total||1)*100)}%`} s={`${closed} closed`} />
            <Label k="7-Day Trend" v={`${trend>0?'+':''}${trend}%`} s="vs previous week" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Avg Severity */}
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Avg Severity</div>
              <div className="text-5xl font-semibold text-white">{avgSev}<span className="text-lg text-zinc-600">/10</span></div>
              <div className="mt-5 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{width:`${(parseFloat(avgSev)/10)*100}%`}} />
              </div>
              <div className="text-xs text-zinc-600 mt-2">
                Violent: {Math.round(((crimeFreq['assault']||0)+(crimeFreq['murder']||0))/(total||1)*100)}% of total
              </div>
            </div>

            {/* Case Status */}
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Case Status</div>
              <div className="flex items-center justify-center">
                <PieChart width={130} height={130}>
                  <Pie data={[{name:'Open',value:open,color:'#ef4444'},{name:'Closed',value:closed,color:'#3b82f6'}]}
                    cx={62} cy={62} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                    <Cell fill="#ef4444" /><Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip {...TT} />
                </PieChart>
              </div>
              <div className="flex justify-around mt-1">
                <div className="text-center"><div className="text-base font-semibold text-red-400 tabular-nums">{open}</div><div className="text-xs text-zinc-600">Open</div></div>
                <div className="text-center"><div className="text-base font-semibold text-blue-400 tabular-nums">{closed}</div><div className="text-xs text-zinc-600">Closed</div></div>
              </div>
            </div>

            {/* Risk */}
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Risk Distribution</div>
              <div className="space-y-3">
                {[
                  {l:'Critical', w:Math.min(100,((crimeFreq['murder']||0)+(crimeFreq['assault']||0))/(total||1)*300)},
                  {l:'High',     w:Math.min(100,((crimeFreq['robbery']||0)+(crimeFreq['kidnapping']||0))/(total||1)*300)},
                  {l:'Medium',   w:Math.min(100,((crimeFreq['theft']||0)+(crimeFreq['burglary']||0))/(total||1)*200)},
                  {l:'Low',      w:Math.min(100,((crimeFreq['vandalism']||0)+(crimeFreq['drug peddling']||0))/(total||1)*200)},
                ].map(r=>(
                  <div key={r.l} className="flex items-center gap-3">
                    <div className="text-xs text-zinc-500 w-16">{r.l}</div>
                    <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-400 rounded-full" style={{width:`${r.w}%`}} />
                    </div>
                    <div className="text-xs text-zinc-600 tabular-nums w-8 text-right">{Math.round(r.w)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar + Radar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Incidents by Type</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={24}>
                  <XAxis dataKey="name" tick={{fill:'#52525b',fontSize:10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} />
                  <Bar dataKey="value" radius={[3,3,0,0]}>
                    {barData.map((e,i)=><Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Crime Radar</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="subject" tick={{fill:'#52525b',fontSize:9}} />
                  <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} />
                  <Tooltip {...TT} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top zones */}
          <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Top Crime Zones</div>
            <div className="space-y-3">
              {allZones.sort((a,b)=>b.crimeCount-a.crimeCount).slice(0,5).map((z,i)=>{
                const max = allZones[0]?.crimeCount??1
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="text-xs text-zinc-700 w-4 tabular-nums">{i+1}</div>
                    <div className="text-xs text-zinc-500 font-mono w-28">{z.centerLat?.toFixed(4)}°N</div>
                    <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-400 rounded-full" style={{width:`${(z.crimeCount/max)*100}%`}} />
                    </div>
                    <div className="text-xs text-zinc-400 w-4 tabular-nums">{z.crimeCount}</div>
                    <div className="text-xs text-zinc-600 w-12">{z.zoneType}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPORAL ── */}
      {tab==='temporal' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">24-Hour Pattern</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourData}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{fill:'#52525b',fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip {...TT} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={1.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Day of Week</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dayData} barSize={28}>
                  <XAxis dataKey="day" tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} />
                  <Bar dataKey="count" radius={[3,3,0,0]}>
                    {dayData.map((e,i)=><Cell key={i} fill={e.w?'#6366f1':'#3b82f6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {[['#6366f1','Weekend'],['#3b82f6','Weekday']].map(([c,l])=>(
                  <div key={l} className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <div className="w-2 h-2 rounded-full" style={{background:c}} />{l}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">30-Day Trend</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trend30}>
                  <XAxis dataKey="date" tick={{fill:'#52525b',fontSize:10}} axisLine={false} tickLine={false} interval={6} />
                  <YAxis tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Peak Hour</div>
              <div className="text-4xl font-semibold text-white tabular-nums">{peakH.hour}:00</div>
              <div className="text-xs text-zinc-600 mt-2">{peakH.count} incidents · {Math.round(peakH.count/(total||1)*100)}% of total</div>
            </div>
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Peak Day</div>
              <div className="text-4xl font-semibold text-white">{peakD.day}</div>
              <div className="text-xs text-zinc-600 mt-2">{peakD.count} incidents · {Math.round(peakD.count/(total||1)*100)}% of total</div>
            </div>
          </div>
        </div>
      )}

      {/* ── INCIDENTS ── */}
      {tab==='incidents' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-56 relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
                placeholder="Search case, type, description..."
                className="w-full bg-[#141414] border border-zinc-800 rounded pl-8 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-600" />
            </div>
            <select value={fType} onChange={e=>{setFType(e.target.value);setPage(1)}}
              className="bg-[#141414] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-400 focus:outline-none cursor-pointer">
              <option value="all">All types</option>
              {types.map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            <select value={fStatus} onChange={e=>{setFStatus(e.target.value);setPage(1)}}
              className="bg-[#141414] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-400 focus:outline-none cursor-pointer">
              <option value="all">All status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-zinc-800 rounded text-zinc-400 text-xs font-medium hover:border-zinc-600 hover:text-zinc-200 transition-all cursor-pointer">
              <Download size={12} /> Export {filtered.length}
            </button>
          </div>

          <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Case No','Date/Time','Type','Status','Description','Reported By'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs text-zinc-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {rows.length===0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-zinc-700">No results</td></tr>
                ) : rows.map(c=>(
                  <tr key={c.crimeId} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-blue-500 font-mono">{c.caseNumber??'—'}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 tabular-nums">
                      {c.occurredAt ? new Date(c.occurredAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{background: CRIME_COLORS[c.crimeType?.toLowerCase()]??'#52525b'}} />
                        <span className="text-xs text-zinc-300 capitalize">{c.crimeType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${c.status?.toLowerCase()==='open' ? 'text-red-400' : 'text-zinc-400'}`}>
                        {c.status??'open'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 max-w-xs truncate">{c.description??'—'}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{c.reportedBy??'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-600">{filtered.length} results · page {page}/{pages||1}</div>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 cursor-pointer transition-colors">
                <ChevronLeft size={13} />
              </button>
              <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages}
                className="p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 cursor-pointer transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}