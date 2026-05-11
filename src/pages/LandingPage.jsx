import { Shield, Camera, MapPin, Activity, AlertTriangle, Eye, Navigation } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-x-hidden">

      {/* ── Fixed background gradients ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950/30 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-800/10 rounded-full blur-3xl" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-widest text-white">CRIMEOPS</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs tracking-widest text-zinc-400">
          <a href="#methodology" className="hover:text-blue-400 transition-colors">METHODOLOGY</a>
          <a href="#overview" className="hover:text-blue-400 transition-colors">OVERVIEW</a>
          <a href="#nagpur" className="hover:text-blue-400 transition-colors">NAGPUR</a>
        </div>
      </nav>

      {/* ── Hero Section with crime BG image ── */}
      {/* ── Hero Section ── */}
      <section className="relative z-10 min-h-[90vh] flex items-center px-8 md:px-16">

        {/* Crime BG image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Police tape background */}
          <img
            src="/police-tape.png"
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.08, filter: 'brightness(0.6)' }}
          />
          {/* Main crime scene overlay */}
          <img
            src="/crime-bg.png"
            alt="crime scene"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.20, filter: 'blur(3px) brightness(0.35)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
        </div>

        {/* Side by side layout — stacks on mobile */}
        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">

          {/* LEFT — Logo — hidden on small mobile, shown on md+ */}
          <div className="hidden md:flex flex-col items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-2xl scale-110" />
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border border-blue-800/30 bg-black/40 backdrop-blur flex items-center justify-center p-6">
                <img src="/nagpur-police-logo.png" alt="Nagpur City Police"
                  className="w-full h-full object-contain drop-shadow-2xl" />
              </div>
            </div>
            <div className="mt-6 text-center">
              <div className="text-sm font-bold tracking-widest text-zinc-300">NAGPUR CITY POLICE</div>
              <div className="text-xs text-zinc-600 tracking-widest mt-1">महाराष्ट्र पोलीस</div>
            </div>
          </div>

          {/* RIGHT — Hero content */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-700/50 bg-blue-950/40 text-blue-400 text-xs tracking-widest mb-6">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              LIVE CRIME INTELLIGENCE · NAGPUR
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none mb-4">
              CRIME<span className="text-blue-500">OPS</span>
            </h1>
            <p className="text-sm md:text-base text-zinc-300 max-w-lg mt-3 leading-relaxed">
              Spatial crime intelligence platform built exclusively for{' '}
              <span className="text-blue-400 font-bold">Nagpur, Maharashtra</span>.
            </p>
            <p className="mt-3 text-xs tracking-widest text-zinc-600 uppercase">
              PostGIS · DBSCAN · Spring Boot · React
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-10 w-full sm:w-auto">
              <button onClick={() => navigate('/nagpur/dashboard')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold tracking-widest rounded transition-all cursor-pointer w-full sm:w-auto">
                ANALYZE NAGPUR →
              </button>
              <a href="#methodology"
                className="px-8 py-3 border border-blue-800/60 hover:border-blue-600 text-zinc-300 text-sm font-bold tracking-widest rounded transition-all text-center w-full sm:w-auto">
                HOW IT WORKS
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="relative z-10 border-y border-blue-900/30 bg-blue-950/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-blue-900/30">
          {[
            { label: 'CRIMES ANALYZED', value: '200+' },
            { label: 'ZONES IDENTIFIED', value: '11' },
            { label: 'CITY', value: 'NAGPUR' },
            { label: 'LIVE UPDATES', value: '60s' },
          ].map((stat) => (
            <div key={stat.label} className="px-8 py-6 text-center">
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs tracking-widest text-zinc-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Methodology ── */}
      <section id="methodology" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14 text-center">
          <p className="text-xs tracking-widest text-blue-500 mb-3">HOW IT WORKS</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">METHODOLOGY</h2>
          <p className="text-zinc-500 mt-3 text-sm max-w-xl mx-auto">
            A four-step intelligence pipeline from raw crime data to actionable deployment zones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-blue-900/30 rounded-lg overflow-hidden">
          {[
            {
              step: '01',
              icon: <Activity size={20} />,
              title: 'DATA INGESTION',
              desc: 'Crimes collected with type, timestamp, lat/lng and reporter details stored in PostGIS.',
              color: 'text-blue-400',
            },
            {
              step: '02',
              icon: <AlertTriangle size={20} />,
              title: 'CATEGORIZATION',
              desc: 'Auto-categorized — theft/burglary → CAMERA, assault/murder → KOBAN, drugs → PATROL.',
              color: 'text-yellow-400',
            },
            {
              step: '03',
              icon: <Eye size={20} />,
              title: 'DBSCAN CLUSTERING',
              desc: 'PostGIS ST_ClusterDBSCAN groups crimes within 500m radius to identify hotspots.',
              color: 'text-blue-300',
            },
            {
              step: '04',
              icon: <MapPin size={20} />,
              title: 'ZONE GENERATION',
              desc: 'Centroid and radius calculated for each cluster — pinpointing exact deployment zones.',
              color: 'text-green-400',
            },
          ].map((item, i) => (
            <div key={item.step}
              className="p-6 border-r border-blue-900/30 last:border-r-0 bg-blue-950/10 hover:bg-blue-950/20 transition-colors">
              <div className={`text-xs font-black ${item.color} mb-4 tracking-widest`}>{item.step}</div>
              <div className={`${item.color} mb-3`}>{item.icon}</div>
              <h3 className="text-sm font-bold text-white tracking-widest mb-2">{item.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Zone Types Overview ── */}
      <section id="overview" className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="mb-14 text-center">
          <p className="text-xs tracking-widest text-blue-500 mb-3">WHAT WE PROVIDE</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">DEPLOYMENT INTELLIGENCE</h2>
          <p className="text-zinc-500 mt-3 text-sm max-w-xl mx-auto">
            Three types of actionable zones generated from Nagpur crime pattern analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Camera size={28} />,
              type: 'CAMERA ZONES',
              color: 'text-blue-400',
              bg: 'bg-blue-950/20',
              border: 'border-blue-800/30',
              crimes: ['Theft', 'Burglary', 'Vehicle Theft', 'Accident', 'Pickpocketing'],
              desc: 'Areas where surveillance cameras should be installed based on property crime clustering.'
            },
            {
              icon: <Shield size={28} />,
              type: 'KOBAN ZONES',
              color: 'text-red-400',
              bg: 'bg-red-950/20',
              border: 'border-red-800/30',
              crimes: ['Assault', 'Murder', 'Rape', 'Kidnapping', 'Mob Lynching'],
              desc: 'High-violence areas requiring permanent police post (koban) deployment.'
            },
            {
              icon: <Navigation size={28} />,
              type: 'PATROL ZONES',
              color: 'text-green-400',
              bg: 'bg-green-950/20',
              border: 'border-green-800/30',
              crimes: ['Drug Peddling', 'Vandalism', 'Trespassing', 'Public Nuisance'],
              desc: 'Areas requiring regular police patrol to deter low-level crime activity.'
            },
          ].map((zone) => (
            <div key={zone.type}
              className={`${zone.bg} border ${zone.border} rounded-lg p-6 hover:scale-[1.02] transition-all duration-300`}>
              <div className={`${zone.color} mb-4`}>{zone.icon}</div>
              <h3 className={`text-sm font-black tracking-widest ${zone.color} mb-2`}>{zone.type}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-4">{zone.desc}</p>
              <div className="flex flex-wrap gap-1">
                {zone.crimes.map(c => (
                  <span key={c} className={`text-xs px-2 py-0.5 rounded border ${zone.border} ${zone.color} opacity-70`}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nagpur CTA ── */}
      <section id="nagpur" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="border border-blue-800/40 rounded-2xl bg-blue-950/20 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/20 via-transparent to-blue-950/20 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-700/50 bg-blue-950/40 text-blue-400 text-xs tracking-widest mb-6">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              LIVE · NAGPUR, MAHARASHTRA
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              READY TO ANALYZE<br />
              <span className="text-blue-500">NAGPUR?</span>
            </h2>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-8">
              View real-time crime clusters, zone overlays, and live crime alerts on an interactive map of Nagpur.
            </p>
            <button
              onClick={() => navigate('/nagpur')}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest rounded-lg transition-all duration-200 hover:shadow-xl hover:shadow-blue-900/40 text-sm cursor-pointer">
              OPEN NAGPUR DASHBOARD →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-blue-900/30 px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Shield size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-widest">CRIMEOPS</span>
          </div>
          <div className="text-xs text-zinc-600 tracking-widest text-center">
            BUILT EXCLUSIVELY FOR NAGPUR · SPATIAL CRIME INTELLIGENCE
          </div>
          <div className="text-xs text-zinc-600 tracking-widest">
            DEV: <span className="text-zinc-400">DEVANSHU MARKAM</span>
          </div>
        </div>
      </footer>

    </div>
  )
}