import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import CompliancePage from './modules/compliance/CompliancePage'
import OperationsPage from './modules/operations/OperationsPage'
import SafetyPage from './modules/safety/SafetyPage'
import WastePage from './modules/waste/WastePage'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import SettingsPage from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function Splash() {
  return (
    <div className="min-h-screen grid place-items-center bg-pine-900 text-white">
      <div className="text-center">
        <div className="text-2xl font-bold tracking-tight">EHSViet</div>
        <div className="mt-2 text-sm text-white/60">Đang tải…</div>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { session, profile, loading } = useAuth()
  if (loading) return <Splash />
  if (!session) return <Login />
  if (!profile) return <Onboarding />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="chat-thai" element={<WastePage />} />
        <Route path="van-hanh" element={<OperationsPage />} />
        <Route path="an-toan" element={<SafetyPage />} />
        <Route path="tuan-thu" element={<CompliancePage />} />
        <Route path="cai-dat" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
