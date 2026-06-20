import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
// Context for managing async errors
const AsyncErrorContext = createContext();
/**
 * AsyncErrorProvider - Wraps the entire app to handle async/promise rejections
 * This catches errors from async API calls that ErrorBoundary can't catch
 */
export const AsyncErrorProvider = ({ children }) => {
  const [asyncError, setAsyncError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const clearError = useCallback(() => {
    setAsyncError(null);
    setIsVisible(false);
  }, []);

  const reportError = useCallback((error) => {
    console.error('🔴 Async error caught:', error);
    setAsyncError(error);
    setIsVisible(true);
    
    // Auto-dismiss after 8 seconds if it's a non-critical error
    if (error?.code !== 'NOT_AUTHENTICATED') {
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Global handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('⚠️ Unhandled promise rejection:', event.reason);
      reportError({
        message: event.reason?.message || 'An unexpected error occurred',
        code: 'UNHANDLED_REJECTION',
        originalError: event.reason,
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [reportError]);

  return (
    <AsyncErrorContext.Provider value={{ reportError, clearError }}>
      {children}
      {isVisible && asyncError && (
        <AsyncErrorNotification error={asyncError} onClose={clearError} />
      )}
    </AsyncErrorContext.Provider>
  );
};
// Hook to use the async error handler in components
export const useAsyncError = () => {
  const context = useContext(AsyncErrorContext);
  if (!context) {
    throw new Error('useAsyncError must be used inside AsyncErrorProvider');
  }
  return context;
};

/**
 * Error notification component - displays async errors to the user
 */
const AsyncErrorNotification = ({ error, onClose }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-right-4">
      <div className="bg-red-900/90 border border-red-700 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-red-100">
              {error?.code === 'NOT_AUTHENTICATED' 
                ? 'Authentication Required'
                : 'Error'}
            </h3>
            <p className="text-red-200 text-sm mt-1">
              {error?.message || 'An unexpected error occurred'}
            </p>
            {import.meta.env.DEV && error?.originalError && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-red-300 hover:text-red-100 mt-2 underline"
              >
                {showDetails ? 'Hide' : 'Show'} details
              </button>
            )}
            {showDetails && (
              <pre className="text-xs bg-red-950 p-2 rounded mt-2 overflow-auto max-h-40 text-red-300">
                {error?.originalError?.stack || String(error?.originalError)}
              </pre>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-red-300 hover:text-red-100 flex-shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
