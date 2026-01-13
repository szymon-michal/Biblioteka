import React, { useMemo } from 'react'
import { AppShell } from './components/AppShell'
import { useHashRoute } from './lib/router'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { DashboardPage } from './pages/Dashboard'
import { CatalogPage } from './pages/Catalog'
import { LoansPage } from './pages/Loans'
import { MembersPage } from './pages/Members'
import { ExplorerPage } from './pages/Explorer'
import { SettingsPage } from './pages/Settings'
import { auth } from './lib/auth'
import type { RouteKey } from './routes'

const routes: Record<RouteKey, React.ReactNode> = {
  login: <LoginPage />,
  register: <RegisterPage />,
  overview: <DashboardPage />,
  dashboard: <DashboardPage />,
  catalog: <CatalogPage />,
  loans: <LoansPage />,
  members: <MembersPage />,
  explorer: <ExplorerPage />,
  settings: <SettingsPage />,
}

const PUBLIC_ROUTES: RouteKey[] = ['login', 'register']

export function App() {
  const { route, navigate } = useHashRoute<RouteKey>('dashboard')
  const isAuthed = auth.isAuthenticated()

  const effectiveRoute: RouteKey = useMemo(() => {
    // ✅ not authed: allow only login/register
    if (!isAuthed) {
      return PUBLIC_ROUTES.includes(route) ? route : 'login'
    }

    // ✅ authed: prevent going back to login/register
    if (PUBLIC_ROUTES.includes(route)) return 'dashboard'

    return route
  }, [isAuthed, route])

  // Render public pages without AppShell
  if (!isAuthed) {
    if (effectiveRoute === 'register') {
      return (
          <RegisterPage
              onSuccess={() => navigate('login')}
              onGoToLogin={() => navigate('login')}
          />
      )
    }
    return (
        <LoginPage
            onSuccess={() => navigate('dashboard')}
            // jeśli chcesz link: dodaj w LoginPage props.onGoToRegister
            // onGoToRegister={() => navigate('register')}
        />
    )
  }

  // Render authenticated app with shell
  return (
      <AppShell current={effectiveRoute} onNavigate={navigate}>
        {routes[effectiveRoute]}
      </AppShell>
  )
}
