import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DashboardLayout from './pages/nagpur/DashboardLayout'
import Dashboard from './pages/nagpur/Dashboard'
import SpatialMap from './pages/nagpur/SpatialMap'
import AIInsights from './pages/nagpur/AIInsights'
import Statistics from './pages/nagpur/Statistics'
import NagpurSettings from './pages/nagpur/NagpurSettings'
import DailyReport from './pages/nagpur/DailyReport'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/nagpur" element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="map"         element={<SpatialMap />} />
          <Route path="insights"    element={<AIInsights />} />
          <Route path="statistics"  element={<Statistics />} />
          <Route path="report" element={<DailyReport />} />
          {/* <Route path="settings"    element={<NagpurSettings />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App