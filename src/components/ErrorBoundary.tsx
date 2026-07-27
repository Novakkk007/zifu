import { Component, type ErrorInfo, type ReactNode } from 'react'
import { GhostButton } from './Buttons'
import { AlertTriangle } from 'lucide-react'

interface Props { children: ReactNode }
interface State {
  errorId: string | null
  retryKey: number
}

/** 生成简短匿名错误 ID（不泄露路径/数据） */
function makeErrorId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let id = ''
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return `ERR-${id}`
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { errorId: null, retryKey: 0 }

  static getDerivedStateFromError(): Partial<State> {
    return { errorId: makeErrorId() }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 仅在 console 输出匿名 ID，不打印原始 error
    console.error(`[ErrorBoundary ${this.state.errorId}]`, info.componentStack?.slice(0, 200))
  }

  /** 真正重试：增加 key 强制 React 卸载并重新挂载整个子树 */
  handleRetry = () => {
    this.setState((s) => ({ errorId: null, retryKey: s.retryKey + 1 }))
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    const { errorId, retryKey } = this.state
    if (errorId) {
      return (
        <div
          role="alert"
          className="flex items-center justify-center min-h-screen bg-deep p-8"
        >
          <div className="max-w-md text-center space-y-6" autoFocus>
            <AlertTriangle className="mx-auto w-12 h-12 text-gold" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-silktext">页面遇到了意外问题</h1>
            <p className="text-sm text-inkmuted">
              请尝试重试或刷新页面。如果问题持续出现，请附上错误代码通过反馈功能告诉我们。
            </p>
            <p className="text-xs font-mono text-golddim select-all" aria-label={`错误代码 ${errorId}`}>
              {errorId}
            </p>
            <div className="flex justify-center gap-4">
              <GhostButton onClick={this.handleRetry}>重试</GhostButton>
              <GhostButton onClick={this.handleRefresh}>刷新页面</GhostButton>
            </div>
          </div>
        </div>
      )
    }
    return <ErrorBoundary key={retryKey}>{this.props.children}</ErrorBoundary>
  }
}
