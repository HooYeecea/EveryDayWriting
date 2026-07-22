import { Component, type ErrorInfo, type ReactNode } from 'react'

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message || ''
  return (
    error.name === 'ChunkLoadError' ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Loading chunk [\d]+ failed/i.test(msg)
  )
}

interface Props {
  children: ReactNode
  /** 自定义失败 UI；默认提供刷新按钮 */
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/** 捕获 lazy/动态 import 失败，避免卸壳后纯白屏 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChunkErrorBoundary]', error, info.componentStack)
  }

  private handleRetry = () => {
    if (isChunkLoadError(this.state.error)) {
      window.location.reload()
      return
    }
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) return this.props.fallback

    const chunkFailed = isChunkLoadError(error)
    return (
      <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-[#fafafa] px-6 text-center">
        <p className="font-sans text-sm font-medium text-neutral-800">
          {chunkFailed ? '资源加载失败，可能是网络波动或站点刚更新' : '页面出了点问题'}
        </p>
        <p className="max-w-sm font-sans text-xs text-neutral-500">
          {chunkFailed ? '刷新页面即可重新获取最新资源。' : error.message}
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="rounded-lg bg-neutral-900 px-4 py-2 font-sans text-xs font-semibold tracking-wide text-white uppercase hover:bg-neutral-800"
        >
          {chunkFailed ? '刷新页面' : '重试'}
        </button>
      </div>
    )
  }
}
