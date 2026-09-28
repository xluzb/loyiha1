import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Oila Moliya app:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.removeItem('oila_moliya_data_v1');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white">
              Ilovani yuklashda xatolik yuz berdi
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Kutilmagan xatolik tufayli sahifa ochilmadi. Quyidagi tugma orqali sahifani yangilashingiz yoki ma'lumotlarni qayta tiklashingiz mumkin.
            </p>

            {this.state.error && (
              <pre className="text-[11px] p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-rose-300 text-left overflow-auto max-h-32 font-mono">
                {this.state.error.message}
              </pre>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sahifani yangilash</span>
              </button>

              <button
                onClick={this.handleResetData}
                className="py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-700/60 text-slate-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
                title="Barcha xotirani tozalash va standart namuna ma'lumotlariga qaytish"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tiklash</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
