import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isModuleError: boolean;
}

/**
 * Error boundary that catches module import failures and other errors.
 * For module import errors, it triggers an automatic reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  private static RELOAD_KEY = 'module_error_reload_attempted';
  
  public state: State = {
    hasError: false,
    error: null,
    isModuleError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const isModuleError = ErrorBoundary.isModuleImportError(error);
    return { hasError: true, error, isModuleError };
  }

  private static isModuleImportError(error: Error): boolean {
    const message = error.message?.toLowerCase() || '';
    const patterns = [
      'importing a module script failed',
      'failed to fetch dynamically imported module',
      'error loading dynamically imported module',
      'failed to load module script',
      'unable to preload css',
      'load failed',
    ];
    return patterns.some(p => message.includes(p));
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // For module import errors, try a one-time reload
    if (ErrorBoundary.isModuleImportError(error)) {
      const hasReloadedRecently = sessionStorage.getItem(ErrorBoundary.RELOAD_KEY);
      
      if (!hasReloadedRecently) {
        console.info('[ErrorBoundary] Module import error detected, reloading...');
        sessionStorage.setItem(ErrorBoundary.RELOAD_KEY, Date.now().toString());
        window.location.reload();
        return;
      } else {
        // Check if enough time has passed (5 minutes) to try again
        const lastReload = parseInt(hasReloadedRecently, 10);
        if (Date.now() - lastReload > 5 * 60 * 1000) {
          sessionStorage.removeItem(ErrorBoundary.RELOAD_KEY);
          window.location.reload();
          return;
        }
      }
    }
  }

  private handleReload = () => {
    sessionStorage.removeItem(ErrorBoundary.RELOAD_KEY);
    window.location.reload();
  };

  private handleGoBack = () => {
    window.history.back();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">
                {this.state.isModuleError ? 'Mise à jour détectée' : 'Une erreur est survenue'}
              </h1>
              <p className="text-muted-foreground">
                {this.state.isModuleError 
                  ? 'Une nouvelle version de l\'application est disponible. Rechargez la page pour continuer.'
                  : 'Quelque chose s\'est mal passé. Essayez de recharger la page.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recharger
              </Button>
              <Button variant="outline" onClick={this.handleGoBack}>
                Retour
              </Button>
            </div>

            {!this.state.isModuleError && this.state.error && (
              <details className="text-left text-xs text-muted-foreground bg-muted/50 rounded-lg p-4">
                <summary className="cursor-pointer font-medium">Détails techniques</summary>
                <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
