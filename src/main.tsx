import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AC Global Error Caught]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBFBFA] text-[#181716] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E9E6E1] p-8 text-center space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#8E3028]/10 text-[#8E3028] flex items-center justify-center mx-auto text-lg font-bold">
              !
            </div>
            <h2 className="text-lg font-semibold text-[#181716]">
              Đã xảy ra lỗi khi khởi tạo giao diện
            </h2>
            <p className="text-xs text-[#77736E] leading-relaxed">
              {this.state.error?.message || 'Vui lòng làm mới trang để tiếp tục trải nghiệm.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full bg-[#8E3028] text-white text-xs font-medium hover:bg-[#722620] transition-colors cursor-pointer"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  );
}

