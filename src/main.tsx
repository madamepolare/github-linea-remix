import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler for uncaught module import errors
const RELOAD_KEY = 'global_module_error_reload';

function isModuleImportError(error: unknown): boolean {
  const message = String(error).toLowerCase();
  const patterns = [
    'importing a module script failed',
    'failed to fetch dynamically imported module',
    'error loading dynamically imported module',
    'failed to load module script',
  ];
  return patterns.some(p => message.includes(p));
}

function handleGlobalError(error: unknown) {
  if (isModuleImportError(error)) {
    const hasReloaded = sessionStorage.getItem(RELOAD_KEY);
    if (!hasReloaded) {
      console.info('[GlobalErrorHandler] Module import error, triggering reload...');
      sessionStorage.setItem(RELOAD_KEY, Date.now().toString());
      window.location.reload();
      return true;
    }
    // Clear after 5 minutes
    const lastReload = parseInt(hasReloaded, 10);
    if (Date.now() - lastReload > 5 * 60 * 1000) {
      sessionStorage.removeItem(RELOAD_KEY);
    }
  }
  return false;
}

window.addEventListener('error', (event) => {
  if (handleGlobalError(event.error || event.message)) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (handleGlobalError(event.reason)) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
