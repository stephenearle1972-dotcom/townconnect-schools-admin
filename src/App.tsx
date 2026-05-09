import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { SchoolProvider } from './lib/school'
import LandingPage from './pages/Landing'
import SignupPage from './pages/Signup'
import LoginPage from './pages/Login'
import AuthCallbackPage from './pages/AuthCallback'
import CompleteSignupPage from './pages/CompleteSignup'
import DashboardLayout from './layouts/DashboardLayout'
import SuperAdminPage from './pages/SuperAdmin'

// Dashboard editor pages are lazy-loaded so the initial bundle stays small.
// TipTap (used by Notices and Narrative) ships with these chunks, not the entry.
const OverviewPage = lazy(() => import('./pages/dashboard/Overview'))
const TeachersPage = lazy(() => import('./pages/dashboard/Teachers'))
const FixturesPage = lazy(() => import('./pages/dashboard/Fixtures'))
const CalendarPage = lazy(() => import('./pages/dashboard/Calendar'))
const NoticesPage = lazy(() => import('./pages/dashboard/Notices'))
const FeesPage = lazy(() => import('./pages/dashboard/Fees'))
const BusRoutesPage = lazy(() => import('./pages/dashboard/BusRoutes'))
const NarrativePage = lazy(() => import('./pages/dashboard/Narrative'))
const FilesPage = lazy(() => import('./pages/dashboard/Files'))
const SettingsPage = lazy(() => import('./pages/dashboard/Settings'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading…</div>}>
      {children}
    </Suspense>
  )
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
          path="/complete-signup"
          element={
            <ProtectedRoute>
              <CompleteSignupPage />
            </ProtectedRoute>
          }
        />
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
          <Route index element={<LazyRoute><OverviewPage /></LazyRoute>} />
          <Route path="teachers" element={<LazyRoute><TeachersPage /></LazyRoute>} />
          <Route path="fixtures" element={<LazyRoute><FixturesPage /></LazyRoute>} />
          <Route path="calendar" element={<LazyRoute><CalendarPage /></LazyRoute>} />
          <Route path="notices" element={<LazyRoute><NoticesPage /></LazyRoute>} />
          <Route path="fees" element={<LazyRoute><FeesPage /></LazyRoute>} />
          <Route path="bus-routes" element={<LazyRoute><BusRoutesPage /></LazyRoute>} />
          <Route path="narrative" element={<LazyRoute><NarrativePage /></LazyRoute>} />
          <Route path="files" element={<LazyRoute><FilesPage /></LazyRoute>} />
          <Route path="settings" element={<LazyRoute><SettingsPage /></LazyRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
