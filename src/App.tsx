import { Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import { AppPageSwitcher } from './components/layout/AppPageSwitcher'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminPageSwitcher } from './components/admin/AdminPageSwitcher'
import { AuthRouteTransition, isAuthPath } from './components/auth/AuthRouteTransition'
import { ChangePassword } from './components/views/ChangePassword'
import { ProficiencyTestPage } from './components/views/ProficiencyTest'
import { useAuth } from './context/AuthContext'
import { useWritingFocus } from './context/WritingFocusContext'
import { DEFAULT_PATH, isAppPath } from './config/routes'
import {
  canAccessAdminPath,
  getFirstAllowedAdminPath,
  isAdminPath,
} from './config/adminRoutes'
import { getToken } from './storage/tokenStorage'
import {
  canAccessAdmin,
  getDefaultHomePath,
  isAdminOnly,
} from './utils/roles'

function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] text-sm text-neutral-400">
      加载中…
    </div>
  )
}

function App() {
  const location = useLocation()
  const { mustChangePassword, isLoading, roles, permissions, isAuthenticated, refreshAccess } =
    useAuth()
  const { navigationLocked } = useWritingFocus()
  const homePath = getDefaultHomePath(roles, permissions)

  useEffect(() => {
    if (!isAuthenticated || !isAdminPath(location.pathname)) return
    void refreshAccess().catch(() => {
      // 权限刷新失败不影响当前页渲染
    })
  }, [isAuthenticated, location.pathname, refreshAccess])

  if (isLoading) {
    return <AppLoading />
  }

  if (mustChangePassword && getToken()) {
    if (location.pathname === '/change-password') {
      return <ChangePassword />
    }
    return <Navigate to="/change-password" replace />
  }

  if (location.pathname === '/change-password') {
    return <Navigate to={homePath} replace />
  }

  if (location.pathname === '/proficiency-test') {
    return <ProficiencyTestPage />
  }

  if (location.pathname === '/') {
    return <Navigate to={homePath} replace />
  }

  if (isAuthPath(location.pathname)) {
    return <AuthRouteTransition />
  }

  if (isAdminPath(location.pathname)) {
    if (!isAuthenticated || !canAccessAdmin(roles, permissions)) {
      return <Navigate to={DEFAULT_PATH} replace />
    }

    if (!canAccessAdminPath(location.pathname, permissions)) {
      return <Navigate to={getFirstAllowedAdminPath(permissions)} replace />
    }

    return (
      <AdminLayout>
        <AdminPageSwitcher />
      </AdminLayout>
    )
  }

  if (isAppPath(location.pathname)) {
    if (isAuthenticated && isAdminOnly(roles)) {
      return <Navigate to={getFirstAllowedAdminPath(permissions)} replace />
    }

    if (navigationLocked && location.pathname !== DEFAULT_PATH) {
      return <Navigate to={DEFAULT_PATH} replace />
    }

    return (
      <Layout>
        <AppPageSwitcher />
      </Layout>
    )
  }

  return <Navigate to={homePath} replace />
}

export default App
