import { useEffect, useLayoutEffect, useRef, useState, type AnimationEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../../config/routes'

function routeIndex(pathname: string): number {
  return APP_ROUTES.findIndex((route) => route.path === pathname)
}

/**
 * 用户端主内容区切换：页面保持挂载（避免写作内容丢失），
 * 按侧栏顺序做方向性滑动 + 淡入，替代 display:none 硬切。
 */
export function AppPageSwitcher() {
  const { pathname } = useLocation()
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

    const from = routeIndex(previous)
    const to = routeIndex(pathname)
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
  }, [pathname])

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
      {APP_ROUTES.map(({ path, key, element }) => {
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
