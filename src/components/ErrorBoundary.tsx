import { Component, type ErrorInfo, type ReactNode } from 'react'
import { GhostButton } from './Buttons'
import { AlertTriangle } from 'lucide-react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-deep p-8">
          <div className="max-w-md text-center space-y-6">
            <AlertTriangle className="mx-auto w-12 h-12 text-gold" />
            <h1 className="text-xl font-semibold text-silktext">页面遇到了意外问题</h1>
            <p className="text-sm text-inkmuted">
              请尝试刷新页面。如果问题持续出现，请通过反馈功能告诉我们。
            </p>
            <div className="flex justify-center gap-4">
              <GhostButton onClick={() => this.setState({ error: null })}>
                重试
              </GhostButton>
              <GhostButton onClick={() => window.location.reload()}>
                刷新页面
              </GhostButton>
            </div>
            <details className="mt-6 text-left">
              <summary className="text-xs text-inkmuted cursor-pointer hover:text-silktext">
                错误详情（调试用）
              </summary>
              <pre className="mt-2 p-3 bg-deep3 rounded-lg text-xs text-inkmuted overflow-auto max-h-40">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack?.slice(0, 800)}
              </pre>
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
