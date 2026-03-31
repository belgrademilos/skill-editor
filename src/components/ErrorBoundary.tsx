import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Editor crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-danger" />
        <h2 className="text-lg font-semibold text-primary">Something went wrong</h2>
        <p className="text-sm text-secondary max-w-md">
          The editor encountered an unexpected error. Your work has been auto-saved.
        </p>
        <pre className="text-xs text-tertiary bg-hover rounded-lg p-3 max-w-lg overflow-auto max-h-32">
          {this.state.error?.message}
        </pre>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-on-accent hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
}
