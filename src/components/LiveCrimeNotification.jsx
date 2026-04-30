import { useState, useEffect, useRef } from 'react'
import { X, AlertTriangle, MapPin, Shield } from 'lucide-react'



const CRIME_ICONS = {
  'theft': '🔴',
  'burglary': '🟣',
  'accident': '🟡',
  'assault': '🔴',
  'murder': '⛔',
  'robbery': '🟠',
  'rape': '⛔',
  'kidnapping': '🔴',
  'drug peddling': '🟢',
  'vandalism': '🟢',
  'pickpocketing': '🔵',
  'mob lynching': '⛔',
}

const CRIME_COLORS = {
  'murder': { bg: 'bg-red-950/95', border: 'border-red-500', badge: 'bg-red-600', label: 'CRITICAL' },
  'rape': { bg: 'bg-red-950/95', border: 'border-red-500', badge: 'bg-red-600', label: 'CRITICAL' },
  'assault': { bg: 'bg-red-950/95', border: 'border-red-500', badge: 'bg-red-600', label: 'CRITICAL' },
  'kidnapping': { bg: 'bg-red-950/95', border: 'border-red-500', badge: 'bg-red-600', label: 'CRITICAL' },
  'mob lynching': { bg: 'bg-red-950/95', border: 'border-red-500', badge: 'bg-red-600', label: 'CRITICAL' },
  'robbery': { bg: 'bg-orange-950/95', border: 'border-orange-500', badge: 'bg-orange-600', label: 'HIGH' },
  'theft': { bg: 'bg-blue-950/95', border: 'border-blue-500', badge: 'bg-blue-600', label: 'ALERT' },
  'burglary': { bg: 'bg-purple-950/95', border: 'border-purple-500', badge: 'bg-purple-600', label: 'ALERT' },
  'accident': { bg: 'bg-yellow-950/95', border: 'border-yellow-500', badge: 'bg-yellow-600', label: 'ALERT' },
  'drug peddling': { bg: 'bg-green-950/95', border: 'border-green-500', badge: 'bg-green-600', label: 'INFO' },
  'vandalism': { bg: 'bg-green-950/95', border: 'border-green-500', badge: 'bg-green-600', label: 'INFO' },
  'pickpocketing': { bg: 'bg-cyan-950/95', border: 'border-cyan-500', badge: 'bg-cyan-600', label: 'INFO' },
}

const getStyle = (crimeType) =>
  CRIME_COLORS[crimeType?.toLowerCase()] ?? {
    bg: 'bg-zinc-900/95', border: 'border-zinc-600', badge: 'bg-zinc-600', label: 'ALERT'
  }

export default function LiveCrimeNotification() {
  const [notifications, setNotifications] = useState([])
  const seenIds = useRef(new Set())

  const markNotified = async (id) => {
    try {
      await fetch(`${API}/live-crimes/${id}/notified`, { method: 'PATCH' })
    } catch (e) { console.error(e) }
  }

  const dismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API}/live-crimes/unnotified`)
        const data = await res.json()

        const newOnes = data.filter(alert => !seenIds.current.has(alert.id))

        newOnes.forEach(alert => {
          seenIds.current.add(alert.id)
          markNotified(alert.id)

          // Add to notifications queue (max 3 visible at once)
          setNotifications(prev => {
            const updated = [{ ...alert, timestamp: new Date() }, ...prev].slice(0, 3)
            return updated
          })

          // Auto dismiss after 6 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== alert.id))
          }, 6000)
        })
      } catch (e) { console.error(e) }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 15000)
    return () => clearInterval(interval)
  }, [])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifications.map((alert, i) => {
        const style = getStyle(alert.crimeType)
        const icon = CRIME_ICONS[alert.crimeType?.toLowerCase()] ?? '🔴'
        const timeAgo = alert.timestamp
          ? `${Math.floor((Date.now() - alert.timestamp) / 1000)}s ago`
          : 'just now'

        return (
          <div
            key={alert.id}
            className={`pointer-events-auto w-80 ${style.bg} border ${style.border} rounded-xl shadow-2xl overflow-hidden
              animate-in slide-in-from-right-full duration-300`}
            style={{
              animation: 'slideIn 0.3s ease-out forwards',
            }}>

            {/* Progress bar (6s countdown) */}
            <div className="h-0.5 bg-zinc-800 w-full">
              <div
                className={`h-full ${style.badge} rounded-full`}
                style={{
                  animation: 'shrink 6s linear forwards',
                  width: '100%',
                }}
              />
            </div>

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-black tracking-widest text-white ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-zinc-500">{timeAgo}</span>
                    </div>
                    <div className="text-sm font-black text-white capitalize mt-0.5">
                      {alert.crimeType} Detected
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismiss(alert.id)}
                  className="text-zinc-500 hover:text-white transition-colors flex-shrink-0 mt-0.5">
                  <X size={14} />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                {alert.description}
              </p>

              {/* Jurisdiction */}
              {alert.jurisdictionName && alert.jurisdictionName !== 'Unknown Area' && (
                <div className="flex items-center gap-1.5 text-xs text-blue-400 mb-1.5">
                  <Shield size={11} className="flex-shrink-0" />
                  <span className="font-medium">{alert.jurisdictionName}</span>
                </div>
              )}

              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <MapPin size={11} className="flex-shrink-0" />
                <span className="font-mono">
                  {alert.latitude?.toFixed(4)}°N, {alert.longitude?.toFixed(4)}°E
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <MapPin size={11} className="flex-shrink-0" />
                <span className="font-mono">
                  {alert.latitude?.toFixed(4)}°N, {alert.longitude?.toFixed(4)}°E
                </span>
              </div>

              {/* Time */}
              <div className="mt-1.5 text-xs text-zinc-600">
                {alert.occurredAt
                  ? new Date(alert.occurredAt).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                  : ''}
              </div>
            </div>
          </div>
        )
      })}

      {/* CSS animations */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}