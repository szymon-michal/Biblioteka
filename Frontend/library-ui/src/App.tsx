import React, { useMemo } from 'react'
import { AppShell } from './components/AppShell'
import { useHashRoute } from './lib/router'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { DashboardPage } from './pages/Dashboard'
import { CatalogPage } from './pages/Catalog'
import { LoansPage } from './pages/Loans'
import { auth } from './lib/auth'
import type { RouteKey } from './routes'

// admin pages
import AdminBooks from './pages/admin/AdminBooks'
import AdminAuthors from './pages/admin/AdminAuthors'
import AdminLoans from './pages/admin/AdminLoans'
import AdminPenalties from './pages/admin/AdminPenalties'
import AdminStats from './pages/admin/AdminStats'
import AdminUsers from './pages/admin/AdminUsers'

const routes: Record<RouteKey, React.ReactNode> = {
  login: <LoginPage />,
  register: <RegisterPage />,
  overview: <DashboardPage />,
  dashboard: <DashboardPage />,
  catalog: <CatalogPage />,
  loans: <LoansPage />,
  members: <AdminUsers />,

  // admin
  adminBooks: <AdminBooks />,
  adminAuthors: <AdminAuthors />,
  adminLoans: <AdminLoans />,
  adminPenalties: <AdminPenalties />,
  adminStats: <AdminStats />,
}

const PUBLIC_ROUTES: RouteKey[] = ['login', 'register']

const ADMIN_ROUTES: RouteKey[] = ['members', 'adminBooks', 'adminAuthors', 'adminLoans', 'adminPenalties', 'adminStats']

export function App() {
  const { route, navigate } = useHashRoute<RouteKey>('dashboard')
  const isAuthed = auth.isAuthenticated()
  const role = auth.getRole()
  const isAdmin = isAuthed && role === 'ADMIN'

  const effectiveRoute: RouteKey = useMemo(() => {
    // not authed: allow only login/register
    if (!isAuthed) {
      return PUBLIC_ROUTES.includes(route) ? route : 'login'
    }

    // authed: prevent going back to login/register
    if (PUBLIC_ROUTES.includes(route)) return 'dashboard'

    // block admin routes for non-admins
    if (ADMIN_ROUTES.includes(route) && !isAdmin) return 'dashboard'

    return route
  }, [isAuthed, route, isAdmin])

  // Render public pages without AppShell
  if (!isAuthed) {
    if (effectiveRoute === 'register') {
      return <RegisterPage onSuccess={() => navigate('login')} onGoToLogin={() => navigate('login')} />
    }
    return <LoginPage onSuccess={() => navigate('dashboard')} />
  }

  return (
    <AppShell current={effectiveRoute} onNavigate={navigate}>
      {routes[effectiveRoute] ?? <DashboardPage />}
    </AppShell>
  )
}
