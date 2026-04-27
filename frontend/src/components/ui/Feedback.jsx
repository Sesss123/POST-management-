import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const show = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ show, success: (m) => show(m, 'success'), error: (m) => show(m, 'error'), info: (m) => show(m, 'info') }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={cn(
              "pointer-events-auto flex items-center gap-4 p-4 rounded-[20px] shadow-2xl animate-in slide-in-from-right-8 duration-300",
              t.type === 'success' ? "bg-emerald-600 text-white" :
              t.type === 'error' ? "bg-rose-600 text-white" : "bg-slate-900 text-white"
            )}
          >
            <div className="shrink-0">
              {t.type === 'success' ? <CheckCircle size={24} /> :
               t.type === 'error' ? <XCircle size={24} /> : <Info size={24} />}
            </div>
            <p className="font-bold text-sm flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

// Form Components
export const FormInput = ({ label, icon: Icon, error, className, ...props }) => (
  <div className={cn("space-y-1.5", className)}>
    {label && <label className="block text-sm font-bold text-slate-700 ml-1">{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />}
      <input 
        className={cn(
          "w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-4 text-slate-900 font-medium placeholder:text-slate-400 transition-all focus:bg-white focus:border-indigo-600 outline-none shadow-sm",
          Icon && "pl-12",
          error && "border-rose-500 bg-rose-50"
        )}
        {...props}
      />
    </div>
    {error && <p className="text-xs font-bold text-rose-500 ml-1">{error}</p>}
  </div>
);

export const FormSelect = ({ label, options, className, ...props }) => (
  <div className={cn("space-y-1.5", className)}>
    {label && <label className="block text-sm font-bold text-slate-700 ml-1">{label}</label>}
    <select 
      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-4 text-slate-900 font-bold appearance-none transition-all focus:bg-white focus:border-indigo-600 outline-none shadow-sm cursor-pointer"
      {...props}
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);
