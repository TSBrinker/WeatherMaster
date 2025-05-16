// src/components/ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary p-4 bg-red-900 bg-opacity-25 rounded border border-red-500 my-4">
          <h2 className="text-xl font-bold text-red-400 mb-2">
            Something went wrong
          </h2>
          <details className="whitespace-pre-wrap">
            <summary className="cursor-pointer text-red-300 mb-2">
              View technical details
            </summary>
            <div className="p-2 bg-gray-900 rounded text-sm font-mono overflow-auto max-h-64">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>
          </details>
          {this.props.fallback || (
            <div className="mt-4">
              <p className="text-gray-300">
                Try refreshing the page or contact support if the issue
                persists.
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
