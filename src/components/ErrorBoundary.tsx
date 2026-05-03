/**
 * ErrorBoundary — catches React render errors, logs them as structured JSON
 * to browser console and localStorage so they're retrievable after a crash.
 *
 * To retrieve crash logs:
 *   JSON.parse(localStorage.getItem('vhc_error_log') ?? '[]')
 */
import React from 'react'

const APP = 'matchvenezuelan.com'
const LS_KEY = 'vhc_error_log'
const MAX_STORED = 50

interface Props {
  children: React.ReactNode
  section?: string
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  errorId: string | null
}

function storeError(entry: Record<string, unknown>) {
  try {
    const existing: unknown[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
    existing.unshift(entry)
    localStorage.setItem(LS_KEY, JSON.stringify(existing.slice(0, MAX_STORED)))
  } catch {}
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorId: null }
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true, errorId: crypto.randomUUID() }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const errorId = this.state.errorId ?? crypto.randomUUID()
    const entry = {
      time: new Date().toISOString(),
      app: APP,
      errorId,
      section: this.props.section ?? 'unknown',
      url: window.location.href,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.slice(0, 800),
      componentStack: info.componentStack?.slice(0, 500),
      userAgent: navigator.userAgent,
    }
    console.error('[ERROR]', JSON.stringify(entry, null, 2))
    storeError(entry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            This section encountered an error. The details have been logged.
          </p>
          {this.state.errorId && (
            <p className="text-xs font-mono mb-4" style={{ opacity: 0.6 }}>
              Error ID: {this.state.errorId}
            </p>
          )}
          <a href="/" className="underline text-sm">Return to homepage</a>
        </div>
      )
    }
    return this.props.children
  }
}

// Global unhandled error capture
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    storeError({
      time: new Date().toISOString(),
      app: APP,
      errorId: crypto.randomUUID(),
      type: 'unhandledrejection',
      url: window.location.href,
      reason: String(event.reason),
    })
  })
  window.addEventListener('error', (event) => {
    storeError({
      time: new Date().toISOString(),
      app: APP,
      errorId: crypto.randomUUID(),
      type: 'global-error',
      url: window.location.href,
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      col: event.colno,
    })
  })
}
