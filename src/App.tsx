import { Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { AppBootLoading } from './components/brand/BrandLoading'
import { ChunkErrorBoundary } from './components/common/ChunkErrorBoundary'
import { Layout } from './components/layout/Layout'
import { AppPageSwitcher } from './components/layout/AppPageSwitcher'
import { useAuth } from './context/AuthContext'
import { useWritingFocus } from './context/WritingFocusContext'
import { DEFAULT_PATH, isAppPath } from './config/routes'
import {
  canAccessAdminPath,
  getFirstAllowedAdminPath,
  isAdminPath,
} from './config/adminPaths'
import { getToken } from './storage/tokenStorage'
import {
  canAccessAdmin,
  getDefaultHomePath,
  isAdminOnly,
} from './utils/roles'
import { isAuthPath } from './config/authPaths'
import { dismissBootSplash } from './utils/bootSplash'

const AdminLayout = lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const AdminPageSwitcher = lazy(() =>
  import('./components/admin/AdminPageSwitcher').then((m) => ({ default: m.AdminPageSwitcher })),
)
const AuthRouteTransition = lazy(() =>
  import('./components/auth/AuthRouteTransition').then((m) => ({
    default: m.AuthRouteTransition,
  })),
)
const ChangePassword = lazy(() =>
  import('./components/views/ChangePassword').then((m) => ({ default: m.ChangePassword })),
)
const ProficiencyTestPage = lazy(() =>
  import('./components/views/ProficiencyTest').then((m) => ({
    default: m.ProficiencyTestPage,
  })),
)

function LazyBoot({ children }: { children: ReactNode }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<AppBootLoading />}>{children}</Suspense>
    </ChunkErrorBoundary>
  )
}

function App() {
  const location = useLocation()
  const { mustChangePassword, isLoading, roles, permissions, isAuthenticated, refreshAccess } =
    useAuth()
  const { navigationLocked } = useWritingFocus()
  const homePath = getDefaultHomePath(roles, permissions)
  const wasOnAdminRef = useRef(false)

  // 鉴权恢复完成后再卸 HTML 启动壳，避免 chunk 失败时已无壳可看
  useLayoutEffect(() => {
    if (!isLoading) dismissBootSplash()
  }, [isLoading])

  useEffect(() => {
    if (!isAuthenticated) {
      wasOnAdminRef.current = false
      return
    }
    const onAdmin = isAdminPath(location.pathname)
    // 从用户端进入管理端时刷新一次权限；管理端子路由间切换不重复请求
    if (onAdmin && !wasOnAdminRef.current) {
      void refreshAccess().catch(() => {
        // 权限刷新失败不影响当前页渲染
      })
    }
    wasOnAdminRef.current = onAdmin
  }, [isAuthenticated, location.pathname, refreshAccess])

  if (isLoading) {
    return <AppBootLoading />
  }

  if (mustChangePassword && getToken()) {
    if (location.pathname === '/change-password') {
      return (
        <LazyBoot>
          <ChangePassword />
        </LazyBoot>
      )
    }
    return <Navigate to="/change-password" replace />
  }

  if (location.pathname === '/change-password') {
    return <Navigate to={homePath} replace />
  }

  if (location.pathname === '/proficiency-test') {
    return (
      <LazyBoot>
        <ProficiencyTestPage />
      </LazyBoot>
    )
  }

  if (location.pathname === '/') {
    return <Navigate to={homePath} replace />
  }

  if (isAuthPath(location.pathname)) {
    return (
      <LazyBoot>
        <AuthRouteTransition />
      </LazyBoot>
    )
  }

  if (isAdminPath(location.pathname)) {
    if (!isAuthenticated || !canAccessAdmin(roles, permissions)) {
      return <Navigate to={DEFAULT_PATH} replace />
    }

    if (!canAccessAdminPath(location.pathname, permissions)) {
      return <Navigate to={getFirstAllowedAdminPath(permissions)} replace />
    }

    return (
      <LazyBoot>
        <AdminLayout>
          <AdminPageSwitcher />
        </AdminLayout>
      </LazyBoot>
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
      <ChunkErrorBoundary>
        <Layout>
          <AppPageSwitcher />
        </Layout>
      </ChunkErrorBoundary>
    )
  }

  return <Navigate to={homePath} replace />
}

export default App
