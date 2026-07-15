import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  AlertDialog,
  type AppAlertOptions,
} from '../components/common/AlertDialog'

interface AppAlertContextValue {
  alert: (options: AppAlertOptions) => Promise<void>
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null)

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<AppAlertOptions | null>(null)
  const resolverRef = useRef<(() => void) | null>(null)

  const alert = useCallback((opts: AppAlertOptions) => {
    return new Promise<void>((resolve) => {
      resolverRef.current?.()
      resolverRef.current = resolve
      setOptions(opts)
    })
  }, [])

  const handleClose = useCallback(() => {
    resolverRef.current?.()
    resolverRef.current = null
    setOptions(null)
  }, [])

  const value = useMemo(() => ({ alert }), [alert])

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      {options && (
        <AlertDialog
          open
          title={options.title}
          message={options.message}
          confirmLabel={options.confirmLabel}
          variant={options.variant}
          onClose={handleClose}
        />
      )}
    </AppAlertContext.Provider>
  )
}

export function useAppAlert() {
  const context = useContext(AppAlertContext)
  if (!context) {
    throw new Error('useAppAlert must be used within AppAlertProvider')
  }
  return context
}
