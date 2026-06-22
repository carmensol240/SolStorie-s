import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
            {/* Friendly Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">✨</span>
            </div>

            {/* Friendly Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                רק רגע... משהו קטן קרה
              </h2>
              <p className="text-muted-foreground">
                לפעמים קורים דברים 🤗 אבל הכל בסדר! נסו לרענן או לחזור לדף הבית.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                aria-label="נסה שוב לטעון את הדף"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                נסו שוב
              </button>
              <button
                onClick={this.handleGoHome}
                aria-label="חזרה לדף הבית"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-200 bg-white text-purple-600 font-medium text-sm hover:bg-purple-50 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                חזרה לדף הבית
              </button>
            </div>

            {/* Reassuring Text */}
            <p className="text-xs text-muted-foreground">
              אם זה ממשיך לקרות, נסו לרענן את הדף 🔄
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
