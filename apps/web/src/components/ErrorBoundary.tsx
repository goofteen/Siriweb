import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // ใน Phase 2 จะส่งไป Sentry
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-4xl">😔</p>
          <h2 className="text-lg font-semibold">เกิดข้อผิดพลาด</h2>
          <p className="text-sm text-muted-foreground">กรุณารีเฟรชหน้า หรือกลับไปหน้าหลัก</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
            >
              รีเฟรช
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/80"
            >
              หน้าหลัก
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
