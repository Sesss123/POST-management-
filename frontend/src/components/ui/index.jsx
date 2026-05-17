import React from 'react';
import { cn } from '../../utils/cn';
export * from './Feedback';

// Button Component
export const AppButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  loading, 
  icon: Icon,
  ...props 
}) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    credit: 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-5 py-2.5 text-sm rounded-2xl font-bold',
    lg: 'px-8 py-4 text-base rounded-[24px] font-black',
    xl: 'px-10 py-6 text-xl rounded-[32px] font-black tracking-tight'
  };

  return (
    <button 
      disabled={loading || props.disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : size === 'md' ? 18 : 24} />}
          {children}
        </>
      )}
    </button>
  );
};

// Card Component
export const AppCard = ({ title, subtitle, icon: Icon, action, children, className, bodyClassName }) => (
  <div className={cn('bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden', className)}>
    {(title || Icon || action) && (
      <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
              <Icon size={20} />
            </div>
          )}
          <div>
            {title && <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs font-medium text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className={cn('p-4 sm:p-5', bodyClassName)}>
      {children}
    </div>
  </div>
);

// Stat Card
export const StatCard = ({ title, value, icon: Icon, trend, variant = 'default', onClick }) => {
  const variants = {
    default: 'bg-white text-slate-900',
    dark: 'bg-slate-900 text-white',
    primary: 'bg-indigo-600 text-white',
    success: 'bg-emerald-600 text-white',
    credit: 'bg-purple-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-blue-600 text-white'
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        'rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 shadow-xl relative overflow-hidden group transition-all', 
        onClick && 'cursor-pointer hover:-translate-y-1 active:scale-95 hover:shadow-2xl',
        variants[variant]
      )}
    >
      <div className="relative z-10">
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-110",
          variant === 'default' ? "bg-slate-50 text-slate-500" : "bg-white/20 text-white"
        )}>
          {Icon && <Icon size={20} className="sm:w-6 sm:h-6" />}
        </div>
        <p className={cn("text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] mb-1", variant === 'default' ? "text-slate-400" : "text-white/60")}>
          {title}
        </p>
        <h2 className="text-xl sm:text-2xl xl:text-3xl font-black tracking-tight leading-none break-all sm:break-normal">{value}</h2>
        {trend && (
          <p className={cn("mt-2 text-[10px] sm:text-xs font-bold", trend.positive ? "text-emerald-400" : "text-rose-400")}>
            {trend.label}
          </p>
        )}
      </div>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-current opacity-[0.03] rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    </div>
  );
};

// Status Badge
export const StatusBadge = ({ status, children, label, className }) => {
  const config = {
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'PAID' },
    unpaid: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'UNPAID' },
    partial: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'PARTIAL' },
    cancelled: { bg: 'bg-slate-100', text: 'text-slate-400', label: 'CANCELLED' },
    available: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'AVAILABLE' },
    occupied: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'OCCUPIED' },
    billing: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'BILLING' },
    active: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'ACTIVE' },
    blocked: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'BLOCKED' },
    credit: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'CREDIT' },
    default: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'INFO' }
  };

  const style = config[status?.toLowerCase()] || config.default;

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
      style.bg,
      style.text,
      className
    )}>
      {children || label || style.label}
    </span>
  );
};

// Table Component
export const AppTable = ({ headers, data, renderRow, loading, emptyMessage, className }) => (
  <div className={cn("overflow-x-auto custom-scrollbar", className)}>
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-100">
          {headers.map((h, i) => (
            <th key={i} className={cn("pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap px-4", h.className)}>
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {loading ? (
          [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={headers.length} className="py-8 bg-slate-50/20"></td></tr>)
        ) : data.length === 0 ? (
          <tr><td colSpan={headers.length} className="py-12 text-center text-slate-400 italic">{emptyMessage || 'No records found'}</td></tr>
        ) : data.map((item, i) => renderRow(item, i))}
      </tbody>
    </table>
  </div>
);

// Generic Badge
export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    primary: 'bg-indigo-50 text-indigo-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    info: 'bg-blue-50 text-blue-600',
    'solid-danger': 'bg-rose-600 text-white shadow-lg shadow-rose-900/20',
    'solid-warning': 'bg-amber-500 text-white shadow-lg shadow-amber-900/20',
    'solid-indigo': 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20',
    'solid-success': 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

// Responsive Data List (Cards for mobile, Table for desktop)
export const ResponsiveDataList = ({ data, renderCard, headers, renderRow, loading, emptyMessage }) => (
    <>
        <div className="block lg:hidden space-y-4">
            {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-3xl" />)
            ) : data.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-200">
                    {emptyMessage || 'No records found'}
                </div>
            ) : (
                data.map((item, i) => renderCard(item, i))
            )}
        </div>
        <div className="hidden lg:block">
            <AppTable 
                headers={headers} 
                data={data} 
                renderRow={renderRow} 
                loading={loading} 
                emptyMessage={emptyMessage} 
            />
        </div>
    </>
);

// Modal Component
export const AppModal = ({ isOpen, onClose, title, description, children, footer, size = 'md' }) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]'
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={cn(
        "bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300 w-full overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]", 
        sizes[size]
      )}>
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight truncate">{title}</h3>
            {description && <p className="text-slate-400 text-[10px] sm:text-sm font-medium line-clamp-1">{description}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

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

// Skeleton Component
export const Skeleton = ({ className, variant = 'rect' }) => {
    return (
        <div className={cn(
            "animate-pulse bg-slate-200",
            variant === 'circle' ? "rounded-full" : "rounded-2xl",
            className
        )} />
    );
};
