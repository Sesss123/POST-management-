import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Package, Clock, Utensils, CreditCard, ShoppingCart, ChevronRight, X } from 'lucide-react';
import { reportApi } from '../../api/api';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState({
        naya: [],
        stock: [],
        held_bills: [],
        kitchen: [],
        suppliers: [],
        cash: []
    });
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await reportApi.getAlerts();
            if (res.data.success) {
                setAlerts(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // Refresh every 5 minutes
        const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allAlerts = [
        ...alerts.naya.map(a => ({ ...a, type: 'naya', icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-50' })),
        ...alerts.stock.map(a => ({ ...a, type: 'stock', icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' })),
        ...alerts.held_bills.map(a => ({ ...a, type: 'held', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' })),
        ...alerts.kitchen.map(a => ({ ...a, type: 'kitchen', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' })),
        ...alerts.suppliers.map(a => ({ ...a, type: 'suppliers', icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-indigo-50' })),
        ...alerts.cash.map(a => ({ ...a, type: 'cash', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' }))
    ].sort((a, b) => (b.severity === 'critical' ? 1 : -1));

    const totalCount = allAlerts.length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 lg:p-2.5 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all relative group",
                    isOpen && "bg-slate-50 text-indigo-600"
                )}
            >
                <Bell size={20} className={cn(totalCount > 0 && !isOpen && "animate-tada")} />
                {totalCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                        {totalCount > 9 ? '9+' : totalCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-32px)] bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">System Alerts</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Real-time platform monitoring</p>
                        </div>
                        <button 
                            onClick={fetchAlerts}
                            disabled={loading}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {allAlerts.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {allAlerts.map((alert, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => {
                                            if (alert.link) navigate(alert.link);
                                            setIsOpen(false);
                                        }}
                                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex gap-4">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", alert.bg, alert.color)}>
                                                <alert.icon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <p className={cn("text-xs font-black uppercase tracking-tight truncate", alert.severity === 'critical' ? 'text-rose-600' : 'text-slate-900')}>
                                                        {alert.title}
                                                    </p>
                                                    {alert.severity === 'critical' && (
                                                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[8px] font-black uppercase whitespace-nowrap">Critical</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                                    {alert.description}
                                                </p>
                                            </div>
                                            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight size={14} className="text-slate-300" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 px-6 text-center">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell size={24} />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">All clear!</h4>
                                <p className="text-xs text-slate-400 mt-2 font-medium italic">No active alerts found for your restaurant.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                        <button 
                            onClick={() => { navigate('/reports'); setIsOpen(false); }}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            View Full Health Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
