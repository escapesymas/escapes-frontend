import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg max-w-md w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2 uppercase italic">¡Vaya! Algo ha fallado</h1>
                        <p className="text-zinc-500 text-sm mb-8">
                            Ha ocurrido un error inesperado en el cockpit. Estamos trabajando para solucionarlo.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-4 rounded-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-900/20"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Reiniciar Sistema
                        </button>

                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="mt-4 text-zinc-600 hover:text-zinc-400 text-xs font-bold uppercase tracking-widest"
                        >
                            Intentar de nuevo sin recargar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
