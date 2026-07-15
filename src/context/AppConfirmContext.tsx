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
  ConfirmDialog,
  type ConfirmOptions,
} from '../components/common/ConfirmDialog'

interface AppConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const AppConfirmContext = createContext<AppConfirmContextValue | null>(null)

export function AppConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current?.(false)
      resolverRef.current = resolve
      setOptions(opts)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true)
    resolverRef.current = null
    setOptions(null)
  }, [])

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false)
    resolverRef.current = null
    setOptions(null)
  }, [])

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <AppConfirmContext.Provider value={value}>
      {children}
      {options && (
        <ConfirmDialog
          open
          title={options.title}
          message={options.message}
          confirmLabel={options.confirmLabel}
          cancelLabel={options.cancelLabel}
          variant={options.variant ?? 'warning'}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </AppConfirmContext.Provider>
  )
}

export function useAppConfirm() {
  const context = useContext(AppConfirmContext)
  if (!context) {
    throw new Error('useAppConfirm must be used within AppConfirmProvider')
  }
  return context
}
