import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnimationEvent,
} from 'react'
import { useLocation } from 'react-router-dom'
import { BrandContentGate } from '../brand/BrandLoading'
import { getVisibleAdminRoutes } from '../../config/adminRoutes'
import { useAuth } from '../../context/AuthContext'

function routeIndex(pathname: string, permissions: string[]): number {
  const visible = getVisibleAdminRoutes(permissions)
  return visible.findIndex((route) => route.path === pathname)
}

/**
 * 管理端主内容区切换：
 * - 首次访问再挂载，之后保活
 * - 首次进入某页时展示品牌加载态，页面 onReady 后再呈现内容
 */
export function AdminPageSwitcher() {
  const { pathname } = useLocation()
  const { permissions } = useAuth()
  const visibleRoutes = getVisibleAdminRoutes(permissions)
  const prevPathRef = useRef(pathname)
  const isFirstNavRef = useRef(true)
  const activePaneRef = useRef<HTMLDivElement | null>(null)
  const [enterClass, setEnterClass] = useState('')
  const [exitingPath, setExitingPath] = useState<string | null>(null)
  const [exitClass, setExitClass] = useState('')
  const exitTimerRef = useRef<number | null>(null)
  const [mountedPaths, setMountedPaths] = useState<Set<string>>(() => new Set([pathname]))
  const [readyPaths, setReadyPaths] = useState<Set<string>>(() => new Set())

  const markPageReady = useCallback((path: string) => {
    setReadyPaths((prev) => {
      if (prev.has(path)) return prev
      const next = new Set(prev)
      next.add(path)
      return next
    })
  }, [])

  useEffect(() => {
    setMountedPaths((prev) => {
      if (prev.has(pathname)) return prev
      const next = new Set(prev)
      next.add(pathname)
      return next
    })
  }, [pathname])

  useLayoutEffect(() => {
    if (isFirstNavRef.current) {
      isFirstNavRef.current = false
      prevPathRef.current = pathname
      return
    }

    const previous = prevPathRef.current
    if (previous === pathname) return

    const from = routeIndex(previous, permissions)
    const to = routeIndex(pathname, permissions)
    const direction: 'next' | 'prev' =
      from >= 0 && to >= 0 ? (to > from ? 'next' : 'prev') : 'next'

    const nextEnter = direction === 'next' ? 'app-page-enter-next' : 'app-page-enter-prev'
    const nextExit = direction === 'next' ? 'app-page-exit-prev' : 'app-page-exit-next'

    setExitingPath(previous)
    setExitClass(nextExit)
    setEnterClass(nextEnter)
    prevPathRef.current = pathname

    const el = activePaneRef.current
    if (el) {
      el.classList.remove('app-page-enter-next', 'app-page-enter-prev')
      void el.offsetWidth
      el.classList.add(nextEnter)
    }

    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current)
    }
    exitTimerRef.current = window.setTimeout(() => {
      setExitingPath(null)
      setExitClass('')
      exitTimerRef.current = null
    }, 420)
  }, [pathname, permissions])

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current)
      }
    }
  }, [])

  const clearEnterClass = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    setEnterClass('')
  }

  return (
    <div className="app-page-shell">
      {visibleRoutes.map(({ path, key, label, component: Page }) => {
        if (!mountedPaths.has(path)) return null

        const isActive = pathname === path
        const isExiting = exitingPath === path
        const ready = readyPaths.has(path)
        const paneClass = [
          'app-page-pane',
          isActive ? 'app-page-pane--active' : '',
          isActive && enterClass ? enterClass : '',
          isExiting ? `app-page-pane--exiting ${exitClass}` : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <div
            key={key}
            ref={isActive ? activePaneRef : undefined}
            className={paneClass}
            aria-hidden={!isActive}
            onAnimationEnd={isActive ? clearEnterClass : undefined}
          >
            <BrandContentGate
              ready={ready}
              loadingLabel={`加载${label}…`}
              minHeight={420}
            >
              <Suspense fallback={null}>
                <Page onReady={() => markPageReady(path)} />
              </Suspense>
            </BrandContentGate>
          </div>
        )
      })}
    </div>
  )
}
