import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { SchoolProvider } from './lib/school'
import LandingPage from './pages/Landing'
import SignupPage from './pages/Signup'
import LoginPage from './pages/Login'
import AuthCallbackPage from './pages/AuthCallback'
import DashboardLayout from './layouts/DashboardLayout'
import OverviewPage from './pages/dashboard/Overview'
import TeachersPage from './pages/dashboard/Teachers'
import FixturesPage from './pages/dashboard/Fixtures'
import CalendarPage from './pages/dashboard/Calendar'
import NoticesPage from './pages/dashboard/Notices'
import FeesPage from './pages/dashboard/Fees'
import BusRoutesPage from './pages/dashboard/BusRoutes'
import NarrativePage from './pages/dashboard/Narrative'
import FilesPage from './pages/dashboard/Files'
import SettingsPage from './pages/dashboard/Settings'
import SuperAdminPage from './pages/SuperAdmin'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/super"
          element={
            <ProtectedRoute>
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SchoolProvider>
                <DashboardLayout />
              </SchoolProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="fixtures" element={<FixturesPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="bus-routes" element={<BusRoutesPage />} />
          <Route path="narrative" element={<NarrativePage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
