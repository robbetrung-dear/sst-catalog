import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto my-12 p-8 bg-white rounded-3xl border border-red-100 shadow-xl text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-black text-slate-900">
              {this.props.fallbackTitle || 'Halaman Sedang Mengalami Kendala'}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {this.props.fallbackMessage ||
                'Data katalog baru saja diperbarui. Silakan muat ulang atau kembali ke halaman utama.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-[#135A62] text-white text-xs font-semibold rounded-xl hover:brightness-110 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
