import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Frontend runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
          <div className="max-w-xl w-full bg-white border border-red-200 rounded-xl shadow p-6">
            <h1 className="text-xl font-semibold text-red-700 mb-2">App Crashed</h1>
            <p className="text-sm text-gray-700 mb-3">
              A runtime error occurred. Refresh the page after fixing the issue.
            </p>
            <pre className="text-xs text-red-700 bg-red-50 p-3 rounded overflow-auto">
              {this.state.error?.message || "Unknown runtime error"}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
