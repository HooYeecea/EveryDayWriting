import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface WritingFocusContextValue {
  /** 计时进行中或已暂停时为 true，禁止切到其它菜单 */
  navigationLocked: boolean
  setNavigationLocked: (locked: boolean) => void
}

const WritingFocusContext = createContext<WritingFocusContextValue | null>(null)

export function WritingFocusProvider({ children }: { children: ReactNode }) {
  const [navigationLocked, setNavigationLockedState] = useState(false)

  const setNavigationLocked = useCallback((locked: boolean) => {
    setNavigationLockedState(locked)
  }, [])

  const value = useMemo(
    () => ({ navigationLocked, setNavigationLocked }),
    [navigationLocked, setNavigationLocked],
  )

  return (
    <WritingFocusContext.Provider value={value}>{children}</WritingFocusContext.Provider>
  )
}

export function useWritingFocus() {
  const context = useContext(WritingFocusContext)
  if (!context) {
    throw new Error('useWritingFocus must be used within WritingFocusProvider')
  }
  return context
}
