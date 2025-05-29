import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Supplies from './pages/Supplies'
import Maintenance from './pages/Maintenance'
import Checklists from './pages/Checklists'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Funcionarios from './pages/Funcionarios'
import Layout from './components/Layout'

// Financeiro
import DashboardFinanceiro from './pages/financeiro/Dashboard'
import CentrosCusto from './pages/financeiro/CentrosCusto'
import ContasPagar from './pages/financeiro/ContasPagar'
import ContasReceber from './pages/financeiro/ContasReceber'
import RelatoriosFinanceiros from './pages/financeiro/Relatorios'

// Mobile Routes
import MobileLogin from './pages/mobile/Login'
import MobileHome from './pages/mobile/Home'
import MobileChecklist from './pages/mobile/Checklist'
import MobileSupply from './pages/mobile/Supply'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { userType, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!userType || !allowedRoles.includes(userType)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function MobileProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { userType, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!userType || !allowedRoles.includes(userType)) {
    return <Navigate to="/m/login" replace />
  }

  return <>{children}</>
}

function isMobileDevice() {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    window.navigator.userAgent.toLowerCase()
  )
}

export function AppRoutes() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const isMobile = isMobileDevice()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Handle unauthenticated users
  if (!session) {
    // Redirect to appropriate login based on device type
    if (isMobile && !location.pathname.startsWith('/m/')) {
      return <Navigate to="/m/login" replace />
    }
    if (!isMobile && location.pathname.startsWith('/m/')) {
      return <Navigate to="/login" replace />
    }

    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/m/login" element={<MobileLogin />} />
        <Route path="*" element={<Navigate to={isMobile ? "/m/login" : "/login"} replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      {/* Desktop Routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        
        <Route
          path="/veiculos"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Vehicles />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/abastecimentos"
          element={
            <ProtectedRoute allowedRoles={['admin', 'operador_abastecimento']}>
              <Supplies />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/manutencoes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Maintenance />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/checklists"
          element={
            <ProtectedRoute allowedRoles={['admin', 'operador_checklist']}>
              <Checklists />
            </ProtectedRoute>
          }
        />

        <Route
          path="/relatorios"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/funcionarios"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Funcionarios />
            </ProtectedRoute>
          }
        />

        {/* Rotas do Financeiro */}
        <Route
          path="/financeiro/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardFinanceiro />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/financeiro/centros-custo"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CentrosCusto />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/financeiro/contas-pagar"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ContasPagar />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/financeiro/contas-receber"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ContasReceber />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/financeiro/relatorios"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RelatoriosFinanceiros />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Mobile Routes */}
      <Route
        path="/m/home"
        element={
          <MobileProtectedRoute allowedRoles={['operador_checklist', 'operador_abastecimento']}>
            <MobileHome />
          </MobileProtectedRoute>
        }
      />
      
      <Route
        path="/m/checklist"
        element={
          <MobileProtectedRoute allowedRoles={['operador_checklist']}>
            <MobileChecklist />
          </MobileProtectedRoute>
        }
      />
      
      <Route
        path="/m/abastecimento"
        element={
          <MobileProtectedRoute allowedRoles={['operador_abastecimento']}>
            <MobileSupply />
          </MobileProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to={isMobile ? "/m/home" : "/"} replace />} />
    </Routes>
  )
}