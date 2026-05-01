import { useState, useEffect, useRef } from 'react'
import { Printer, Download, AlertTriangle, MapPin } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import API from '../../api'

const COLORS = ['#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6','#06b6d4','#f97316','#84cc16','#db2777','#7c3aed']

const today = new Date().toLocaleDateString('en-IN', {
  day: '2-digit', month: 'long', year: 'numeric'
})

export default function DailyReport() {
  const [crimes, setCrimes]             = useState([])
  const [zones, setZones]               = useState([])
  const [jStats, setJStats]             = useState([])
  const [liveCrimesToday, setLiveToday] = useState([])
  const [loading, setLoading]           = useState(true)
  const reportRef = useRef(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [c, z, j, live] = await Promise.all([
          fetch(`${API}/crimes`).then(r => r.json()),
          fetch(`${API}/analysis/zones`).then(r => r.json()),
          fetch(`${API}/jurisdictions/stats`).then(r => r.json()),
          fetch(`${API}/live-crimes/today`).then(r => r.json()),
        ])
        setCrimes(c)
        setZones(z.zones ?? [])
        setJStats(j)
        setLiveToday(live)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const total       = crimes.length
  const openCount   = crimes.filter(c => c.status?.toLowerCase() === 'open').length
  const closedCount = crimes.filter(c => c.status?.toLowerCase() === 'closed').length
  const crimeFreq   = crimes.reduce((a, c) => { a[c.crimeType] = (a[c.crimeType] || 0) + 1; return a }, {})
  const barData     = Object.entries(crimeFreq).sort((a, b) => b[1] - a[1]).map(([n, v]) => ({ name: n, count: v }))
  const allZones    = zones

  const jWithTrend = jStats.map(j => ({
    ...j,
    trend: Math.round((Math.random() - 0.4) * 20),
    priority: parseInt(j.totalCrimes) >= 10 ? 'CRITICAL' :
              parseInt(j.totalCrimes) >= 5  ? 'HIGH'     :
              parseInt(j.totalCrimes) >= 2  ? 'MEDIUM'   : 'LOW'
  }))

  const pieData = [
    { name: 'Open',   value: openCount   },
    { name: 'Closed', value: closedCount },
  ]

  const priorityColors = {
    CRITICAL: 'text-red-400 bg-red-900/20 border-red-800/30',
    HIGH:     'text-orange-400 bg-orange-900/20 border-orange-800/30',
    MEDIUM:   'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
    LOW:      'text-green-400 bg-green-900/20 border-green-800/30',
  }

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210

    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, W, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CRIMEOPS — Daily Jurisdictional Report', W / 2, 14, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 160)
    doc.text(`Date: ${today} | Nagpur City Police | System: Operational`, W / 2, 22, { align: 'center' })
    doc.text(`Jurisdictions: ${jStats.length} | Incidents: ${total} | Live Today: ${liveCrimesToday.length}`, W / 2, 29, { align: 'center' })

    let y = 42

    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30)
    doc.text('1. City-Wide Summary', 14, y); y += 6

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Incidents', total],
        ['Open Cases', openCount],
        ['Closed Cases', closedCount],
        ['Active Zones', allZones.length],
        ['Jurisdictions Monitored', jStats.length],
        ["Today's Live Crimes", liveCrimesToday.length],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30,30,30], textColor: [255,255,255] },
      alternateRowStyles: { fillColor: [245,245,245] },
      margin: { left: 14, right: 14 },
    })

    y = doc.lastAutoTable.finalY + 10
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30)
    doc.text('2. Distribution by Jurisdiction', 14, y); y += 6

    autoTable(doc, {
      startY: y,
      head: [['Jurisdiction','Total','Open','Closed','Primary Crime','Priority']],
      body: jWithTrend.map(j => [j.name??'—', j.totalCrimes??0, j.openCrimes??0, j.closedCrimes??0, j.primaryCrimeType??'—', j.priority]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30,30,30], textColor: [255,255,255] },
      alternateRowStyles: { fillColor: [245,245,245] },
      margin: { left: 14, right: 14 },
    })

    y = doc.lastAutoTable.finalY + 10
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30)
    doc.text('3. Hotspot Analysis', 14, y); y += 6

    autoTable(doc, {
      startY: y,
      head: [['Zone','Lat','Lng','Crimes','Dominant','Radius(m)','Action']],
      body: allZones.sort((a,b)=>b.crimeCount-a.crimeCount).map(z => [
        z.zoneType, z.centerLat?.toFixed(4), z.centerLng?.toFixed(4), z.crimeCount,
        z.dominantCrime??'—', Math.round(z.radiusMeters),
        z.zoneType==='CAMERA'?'Install CCTV':z.zoneType==='KOBAN'?'Deploy Koban':'Increase Patrol'
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30,30,30], textColor: [255,255,255] },
      alternateRowStyles: { fillColor: [245,245,245] },
      margin: { left: 14, right: 14 },
    })

    y = doc.lastAutoTable.finalY + 10
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30)
    doc.text('4. System Performance', 14, y); y += 6

    autoTable(doc, {
      startY: y,
      head: [['Component','Technology','Status']],
      body: [
        ['Live Crime Generator','Spring @Scheduled (60s)','✓ Operational'],
        ['Jurisdiction Assignment','PostGIS ST_Contains','✓ Active'],
        ['DBSCAN Clustering','ST_ClusterDBSCAN (500m)','✓ Active'],
        ['Daily Data Cleanup','Cron job @ midnight','✓ Active'],
      ],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30,30,30], textColor: [255,255,255] },
      alternateRowStyles: { fillColor: [245,245,245] },
      margin: { left: 14, right: 14 },
    })

    y = doc.lastAutoTable.finalY + 10
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30)
    doc.text(`5. Today's Live Crime Feed — ${today}`, 14, y); y += 4
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,100,100)
    doc.text(`${liveCrimesToday.length} crimes recorded today. Resets at midnight.`, 14, y); y += 4

    autoTable(doc, {
      startY: y,
      head: [['Time','Crime Type','Jurisdiction','Description','Coordinates']],
      body: liveCrimesToday.map(c => [
        c.occurredAt ? new Date(c.occurredAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—',
        c.crimeType??'—', c.jurisdictionName??'Unknown', c.description??'—',
        `${c.latitude?.toFixed(4)??'—'}, ${c.longitude?.toFixed(4)??'—'}`,
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30,30,30], textColor: [255,255,255] },
      alternateRowStyles: { fillColor: [245,245,245] },
      margin: { left: 14, right: 14 },
    })

    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7); doc.setTextColor(150,150,150)
      doc.text(`CRIMEOPS — Nagpur City Police | Confidential | Page ${i} of ${pageCount}`, W/2, 290, {align:'center'})
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W/2, 295, {align:'center'})
    }

    doc.save(`crimeops_report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  if (loading) return (
    <div className="px-4 pt-20 md:pt-7 pb-7 text-zinc-500 text-sm">Loading report...</div>
  )

  return (
    <div className="px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-5" ref={reportRef}>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">Daily Jurisdictional Report</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Date: {today} · Nagpur City Police</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              {jStats.length} Jurisdictions · {total} Incidents · {liveCrimesToday.length} Live Today
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-zinc-700 rounded-lg text-zinc-400 text-xs font-medium hover:border-zinc-500 transition-all cursor-pointer">
              <Printer size={12} /> Print
            </button>
            <button onClick={generatePDF}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-medium transition-all cursor-pointer">
              <Download size={12} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Summary */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-3">1. City-Wide Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Total Incidents',     value: total },
            { label:'Open Cases',          value: openCount },
            { label:'Closed Cases',        value: closedCount },
            { label:"Today's Live Crimes", value: liveCrimesToday.length },
          ].map(card => (
            <div key={card.label} className="bg-[#141414] border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-semibold text-white tabular-nums">{card.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Jurisdiction Table */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-3">2. Distribution by Jurisdiction</h2>
        <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  {['Jurisdiction','Total','Open','Closed','Primary Crime','Priority'].map(h => (
                    <th key={h} className="px-3 md:px-4 py-3 text-left text-xs text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {jWithTrend.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-zinc-700">No jurisdiction data yet.</td></tr>
                ) : jWithTrend.map((j, i) => (
                  <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-3 md:px-4 py-3 text-xs text-zinc-300 font-medium whitespace-nowrap">{j.name}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-white font-semibold tabular-nums">{j.totalCrimes??0}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-red-400 tabular-nums">{j.openCrimes??0}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-blue-400 tabular-nums">{j.closedCrimes??0}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-zinc-400 capitalize whitespace-nowrap">{j.primaryCrimeType??'—'}</td>
                    <td className="px-3 md:px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium whitespace-nowrap ${priorityColors[j.priority]}`}>
                        {j.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-medium">Incidents by Type</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barSize={18}>
              <XAxis dataKey="name" tick={{fill:'#52525b',fontSize:8}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#52525b',fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'#111',border:'1px solid #27272a',borderRadius:6,fontSize:10}}/>
              <Bar dataKey="count" radius={[3,3,0,0]}>
                {barData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-5">
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-medium">Case Status</div>
          <div className="flex items-center justify-center gap-6">
            <PieChart width={130} height={130}>
              <Pie data={pieData} cx={62} cy={62} innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                <Cell fill="#ef4444"/><Cell fill="#3b82f6"/>
              </Pie>
              <Tooltip contentStyle={{background:'#111',border:'1px solid #27272a',borderRadius:6,fontSize:10}}/>
            </PieChart>
            <div className="space-y-3">
              <div>
                <div className="text-xl font-semibold text-red-400 tabular-nums">{openCount}</div>
                <div className="text-xs text-zinc-500">Open</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-blue-400 tabular-nums">{closedCount}</div>
                <div className="text-xs text-zinc-500">Closed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Hotspot Analysis */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-3">3. Hotspot Analysis</h2>
        <div className="space-y-2">
          {allZones.sort((a,b)=>b.crimeCount-a.crimeCount).slice(0,6).map((zone,i) => {
            const zc = {
              CAMERA:{text:'text-blue-400',border:'border-blue-800/30',action:'Install CCTV'},
              KOBAN: {text:'text-red-400', border:'border-red-800/30', action:'Deploy Koban'},
              PATROL:{text:'text-green-400',border:'border-green-800/30',action:'Increase Patrol'},
            }[zone.zoneType] ?? {text:'text-zinc-400',border:'border-zinc-800',action:'Review'}
            return (
              <div key={i} className={`bg-[#141414] border ${zc.border} rounded-lg p-3 md:p-4`}>
                <div className="flex items-start gap-3">
                  <div className={`text-xs font-bold ${zc.text} w-14 flex-shrink-0 mt-0.5`}>{zone.zoneType}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <MapPin size={10} className="text-zinc-600 flex-shrink-0"/>
                      <span className="text-xs text-zinc-400 font-mono">{zone.centerLat?.toFixed(4)}°N, {zone.centerLng?.toFixed(4)}°E</span>
                      <span className="text-xs text-zinc-600">· {zone.crimeCount} crimes · {Math.round(zone.radiusMeters)}m</span>
                    </div>
                    <div className="text-xs text-zinc-600">
                      <span className="text-zinc-500">Dominant: </span>
                      <span className="text-zinc-400 capitalize">{zone.dominantCrime}</span>
                      <span className="mx-1.5 text-zinc-700">·</span>
                      <span className={zc.text}>{zc.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {allZones.length === 0 && (
            <div className="bg-[#141414] border border-zinc-800 rounded-lg p-8 text-center text-xs text-zinc-700">
              No hotspot data. Run analysis first.
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Inter-Jurisdictional */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-3">4. Inter-Jurisdictional Analysis</h2>
        <div className="bg-[#141414] border border-zinc-800 rounded-lg p-4 md:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={13} className="text-yellow-400 mt-0.5 flex-shrink-0"/>
            <div className="space-y-1.5">
              <div className="text-xs text-zinc-300 font-medium">Border Zone Alert</div>
              <div className="text-xs text-zinc-500">Crimes within 50m of boundaries need joint patrol coordination.</div>
              <div className="text-xs text-zinc-600">Deploy mobile patrol vans at jurisdiction boundary intersections.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: System Performance */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-3">5. System Performance</h2>
        <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  {['Component','Technology','Status'].map(h=>(
                    <th key={h} className="px-3 md:px-4 py-3 text-left text-xs text-zinc-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {[
                  ['Live Crime Generator','@Scheduled (60s)','✓ Operational'],
                  ['Jurisdiction Assignment','PostGIS ST_Contains','✓ Active'],
                  ['DBSCAN Clustering','ST_ClusterDBSCAN','✓ Active'],
                  ['Daily Cleanup','Cron @ midnight','✓ Active'],
                ].map(([comp,tech,status])=>(
                  <tr key={comp} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-3 md:px-4 py-3 text-xs text-zinc-300 whitespace-nowrap">{comp}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-zinc-500 font-mono">{tech}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-green-400">{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 6: Today's Live Crimes */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-3">
          6. Today's Live Crime Feed — {today}
        </h2>
        <div className="bg-[#141414] border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">{liveCrimesToday.length} crimes today</span>
            <span className="text-xs text-zinc-600">Resets at midnight</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  {['Time','Crime Type','Jurisdiction','Description','Coordinates'].map(h=>(
                    <th key={h} className="px-3 md:px-4 py-3 text-left text-xs text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {liveCrimesToday.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-zinc-700">
                    No live crimes yet today. Generator runs every 60 seconds.
                  </td></tr>
                ) : liveCrimesToday.map(crime => (
                  <tr key={crime.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-3 md:px-4 py-3 text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                      {crime.occurredAt ? new Date(crime.occurredAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—'}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs text-zinc-300 capitalize font-medium whitespace-nowrap">{crime.crimeType}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-blue-400 whitespace-nowrap">{crime.jurisdictionName??'Unknown'}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-zinc-500 max-w-xs truncate">{crime.description}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-zinc-700 font-mono whitespace-nowrap">
                      {crime.latitude?.toFixed(4)}, {crime.longitude?.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .bg-\\[\\#141414\\] { background: #f9f9f9 !important; }
          .border-zinc-800 { border-color: #e5e7eb !important; }
          .text-white { color: #111 !important; }
          .text-zinc-300 { color: #374151 !important; }
          .text-zinc-400 { color: #6b7280 !important; }
          .text-zinc-500 { color: #9ca3af !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  )
}