'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorInfo?: React.ErrorInfo }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} errorInfo={this.state.errorInfo} />
      }

      return (
        <div className="min-h-screen gradient-bg flex items-center justify-center">
          <div className="max-w-md mx-auto p-6">
            <div className="modern-card">
              <h2 className="text-xl font-bold text-white mb-4">Application Error</h2>
              <div className="text-red-400 mb-4">
                <p className="font-medium">Something went wrong:</p>
                <p className="text-sm mt-2">{this.state.error?.message}</p>
              </div>
              <details className="text-xs text-gray-400 mb-4">
                <summary className="cursor-pointer text-gray-300">Error Details</summary>
                <pre className="mt-2 p-2 bg-gray-800 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 p-2 bg-gray-800 rounded overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary w-full"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
