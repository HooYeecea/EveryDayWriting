import { useEffect, useLayoutEffect, useRef, useState, type AnimationEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { getVisibleAdminRoutes } from '../../config/adminRoutes'
import { useAuth } from '../../context/AuthContext'

function routeIndex(pathname: string, permissions: string[]): number {
  const visible = getVisibleAdminRoutes(permissions)
  return visible.findIndex((route) => route.path === pathname)
}

/**
 * 管理端主内容区切换：页面保持挂载，按侧栏可见菜单顺序做方向性滑动 + 淡入。
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
      {visibleRoutes.map(({ path, key, element }) => {
        const isActive = pathname === path
        const isExiting = exitingPath === path
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
            {element}
          </div>
        )
      })}
    </div>
  )
}
