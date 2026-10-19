import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'

// Các phân hệ tải theo trang (tách gói) – trang Tổng quan tải sẵn
const ActionsPage = lazy(() => import('./modules/actions/ActionsPage'))
const ChemicalsPage = lazy(() => import('./modules/chemicals/ChemicalsPage'))
const CircularPage = lazy(() => import('./modules/circular/CircularPage'))
const CompliancePage = lazy(() => import('./modules/compliance/CompliancePage'))
const EquipmentPage = lazy(() => import('./modules/equipment/EquipmentPage'))
const EsgPage = lazy(() => import('./modules/esg/EsgPage'))
const HealthPage = lazy(() => import('./modules/health/HealthPage'))
const InspectionPage = lazy(() => import('./modules/inspection/InspectionPage'))
const OperationsPage = lazy(() => import('./modules/operations/OperationsPage'))
const OrgPage = lazy(() => import('./modules/org/OrgPage'))
const PersonnelPage = lazy(() => import('./modules/personnel/PersonnelPage'))
const PlanPage = lazy(() => import('./modules/plan/PlanPage'))
const RulesPage = lazy(() => import('./modules/rules/RulesPage'))
const SafetyPage = lazy(() => import('./modules/safety/SafetyPage'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const WastePage = lazy(() => import('./modules/waste/WastePage'))

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
        <Route path="nhan-su" element={<PersonnelPage />} />
        <Route path="an-toan" element={<SafetyPage />} />
        <Route path="thiet-bi" element={<EquipmentPage />} />
        <Route path="kiem-tra" element={<InspectionPage />} />
        <Route path="khac-phuc" element={<ActionsPage />} />
        <Route path="ke-hoach" element={<PlanPage />} />
        <Route path="to-chuc" element={<OrgPage />} />
        <Route path="hoa-chat" element={<ChemicalsPage />} />
        <Route path="tuan-hoan" element={<CircularPage />} />
        <Route path="suc-khoe" element={<HealthPage />} />
        <Route path="noi-quy" element={<RulesPage />} />
        <Route path="esg" element={<EsgPage />} />
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
