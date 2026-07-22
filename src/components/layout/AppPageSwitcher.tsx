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
import { BrandContentGate, BrandLoading } from '../brand/BrandLoading'
import { ChunkErrorBoundary } from '../common/ChunkErrorBoundary'
import { APP_ROUTES, DEFAULT_PATH } from '../../config/routes'
import { getRouteLabelKey, useT } from '../../i18n'

function routeIndex(pathname: string): number {
  return APP_ROUTES.findIndex((route) => route.path === pathname)
}

/**
 * 用户端主内容区切换：
 * - `/writing` 始终挂载，避免写作内容丢失
 * - 其它页首次访问再挂载，之后保活（保留退出动画与二次进入状态）
 * - 首次进入某页时展示品牌加载态，页面 onReady 后再呈现内容
 */
export function AppPageSwitcher() {
  const { pathname } = useLocation()
  const t = useT()
  const prevPathRef = useRef(pathname)
  const isFirstNavRef = useRef(true)
  const activePaneRef = useRef<HTMLDivElement | null>(null)
  const [enterClass, setEnterClass] = useState('')
  const [exitingPath, setExitingPath] = useState<string | null>(null)
  const [exitClass, setExitClass] = useState('')
  const exitTimerRef = useRef<number | null>(null)
  const [mountedPaths, setMountedPaths] = useState<Set<string>>(
    () => new Set([DEFAULT_PATH, pathname]),
  )
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

    const from = routeIndex(previous)
    const to = routeIndex(pathname)
    const direction: 'next' | 'prev' =
      from >= 0 && to >= 0 ? (to > from ? 'next' : 'prev') : 'next'

    const nextEnter = direction === 'next' ? 'app-page-enter-next' : 'app-page-enter-prev'
    const nextExit = direction === 'next' ? 'app-page-exit-prev' : 'app-page-exit-next'
    // 已就绪的保活页跳过 opacity 淡入，避免切回时被当成二次加载
    const skipEnterFade = readyPaths.has(pathname)

    setExitingPath(previous)
    setExitClass(nextExit)
    setEnterClass(skipEnterFade ? '' : nextEnter)
    prevPathRef.current = pathname

    const el = activePaneRef.current
    if (el && !skipEnterFade) {
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
  }, [pathname, readyPaths])

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
      {APP_ROUTES.map(({ path, key, component: Page }) => {
        if (!mountedPaths.has(path)) return null

        const isActive = pathname === path
        const isExiting = exitingPath === path
        const ready = readyPaths.has(path)
        const routeLabel = t(getRouteLabelKey(key))
        const loadingLabel = t('common.loadingPage', { name: routeLabel })
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
              loadingLabel={loadingLabel}
              minHeight={420}
            >
              <ChunkErrorBoundary>
                <Suspense
                  fallback={
                    <BrandLoading label={loadingLabel} minHeight={420} className="rounded-none border-0 shadow-none" />
                  }
                >
                  <Page onReady={() => markPageReady(path)} />
                </Suspense>
              </ChunkErrorBoundary>
            </BrandContentGate>
          </div>
        )
      })}
    </div>
  )
}
