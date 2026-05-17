import React, { useState, useCallback, useMemo, createContext, useContext } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    const toastType = type === 'danger' ? 'error' : type;
    setToasts(prev => [...prev, { id, message, type: toastType }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const value = useMemo(() => ({ 
      showToast: addToast,
      addToast, 
      success: (m) => addToast(m, 'success'), 
      error: (m) => addToast(m, 'error'), 
      danger: (m) => addToast(m, 'error'),
      info: (m) => addToast(m, 'info'),
      warning: (m) => addToast(m, 'warning')
  }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-[300px] w-full pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={cn(
              "pointer-events-auto flex items-center gap-3 py-2.5 px-4 rounded-full shadow-lg border border-white/10 animate-in slide-in-from-bottom-4 duration-300 backdrop-blur-md",
              t.type === 'success' ? "bg-emerald-500/95 text-white" :
              t.type === 'error' || t.type === 'danger' ? "bg-rose-500/95 text-white" : 
              t.type === 'warning' ? "bg-amber-500/95 text-white" :
              "bg-slate-900/95 text-white"
            )}
          >
            <div className="shrink-0">
              {t.type === 'success' ? <CheckCircle size={16} /> :
               t.type === 'error' ? <XCircle size={16} /> : <Info size={16} />}
            </div>
            <p className="font-bold text-xs flex-1 truncate">{t.message}</p>
            <button onClick={() => remove(t.id)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
