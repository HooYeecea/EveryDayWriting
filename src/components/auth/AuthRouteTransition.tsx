import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Login } from '../views/Login'
import { Register } from '../views/Register'
import { ForgotPassword } from '../views/ForgotPassword'

const AUTH_ROUTES = {
  '/login': Login,
  '/register': Register,
  '/forgot-password': ForgotPassword,
} as const

type AuthPath = keyof typeof AUTH_ROUTES

/** 交叉淡入淡出时长（ms） */
export const AUTH_TRANSITION_MS = 1000

export function isAuthPath(pathname: string): pathname is AuthPath {
  return pathname in AUTH_ROUTES
}

function AuthPage({ path }: { path: AuthPath }) {
  const Component = AUTH_ROUTES[path]
  return <Component />
}

export function AuthRouteTransition() {
  const location = useLocation()
  const pathname = location.pathname

  const displayedPathRef = useRef<AuthPath | null>(
    isAuthPath(pathname) ? pathname : null,
  )
  const clearTimerRef = useRef<number | null>(null)

  const [currentPath, setCurrentPath] = useState<AuthPath | null>(
    displayedPathRef.current,
  )
  const [exitingPath, setExitingPath] = useState<AuthPath | null>(null)
  /** 每次切换递增，强制重播 CSS 动画 */
  const [transitionKey, setTransitionKey] = useState(0)

  useEffect(() => {
    if (!isAuthPath(pathname)) return

    const previous = displayedPathRef.current
    if (!previous || previous === pathname) {
      displayedPathRef.current = pathname
      setCurrentPath(pathname)
      return
    }

    displayedPathRef.current = pathname
    setExitingPath(previous)
    setCurrentPath(pathname)
    setTransitionKey((key) => key + 1)

    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current)
    }

    clearTimerRef.current = window.setTimeout(() => {
      setExitingPath(null)
      clearTimerRef.current = null
    }, AUTH_TRANSITION_MS)
  }, [pathname])

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current)
      }
    }
  }, [])

  if (!isAuthPath(pathname)) {
    return <Navigate to="/login" replace />
  }

  if (!currentPath) {
    return null
  }

  const isAnimating = transitionKey > 0

  return (
    <div className="auth-route-shell">
      {exitingPath && (
        <div
          key={`exit-${exitingPath}-${transitionKey}`}
          className="auth-route-layer auth-route-layer-exit"
          aria-hidden
        >
          <AuthPage path={exitingPath} />
        </div>
      )}
      <div
        key={`enter-${currentPath}-${transitionKey}`}
        className={`auth-route-layer ${
          isAnimating ? 'auth-route-layer-enter' : 'auth-route-layer-static'
        }`}
      >
        <AuthPage path={currentPath} />
      </div>
    </div>
  )
}
