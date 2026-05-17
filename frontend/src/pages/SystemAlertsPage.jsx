import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../api/api';
import { 
  Bell, 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  CreditCard,
  Package,
  Activity,
  ChevronLeft
} from 'lucide-react';
import { AppButton, Skeleton, useToast } from '../components/ui';
import { cn } from '../utils/cn';

const AlertItem = ({ alert }) => {
    const severityStyles = {
        critical: 'bg-rose-50 border-rose-100 text-rose-700',
        warning: 'bg-amber-50 border-amber-100 text-amber-700',
        info: 'bg-blue-50 border-blue-100 text-blue-700',
        success: 'bg-emerald-50 border-emerald-100 text-emerald-700'
    };

    const iconStyles = {
        critical: 'text-rose-600',
        warning: 'text-amber-600',
        info: 'text-blue-600',
        success: 'text-emerald-600'
    };

    const Icon = alert.severity === 'critical' ? AlertTriangle : 
                 alert.severity === 'warning' ? AlertTriangle : 
                 alert.severity === 'success' ? CheckCircle2 : Info;

    return (
        <a 
            href={alert.link}
            className={cn(
                "flex items-start gap-4 p-6 rounded-[32px] border transition-all hover:scale-[1.02] active:scale-95 group shadow-sm",
                severityStyles[alert.severity] || severityStyles.info
            )}
        >
            <div className={cn("mt-1 shrink-0 p-3 rounded-2xl bg-white/50", iconStyles[alert.severity])}>
                <Icon size={20} />
            </div>
            <div className="flex-1">
                <h5 className="text-[10px] font-black uppercase tracking-[0.1em] mb-1 opacity-60">{alert.title}</h5>
                <p className="text-sm font-bold leading-relaxed">{alert.description}</p>
            </div>
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={18} />
            </div>
        </a>
    );
};

const SystemAlertsPage = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAlerts = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await reportApi.getAlerts();
            setAlerts(res.data.data);
        } catch (err) {
            console.error(err);
            addToast('Failed to fetch system alerts', 'danger');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const totalAlertCount = alerts ? Object.values(alerts).reduce((acc, curr) => acc + curr.length, 0) : 0;

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Bell className="text-indigo-600" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">System Monitoring</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Operational Alerts</h1>
                    </div>
                </div>

                <AppButton 
                    variant="secondary" 
                    size="lg" 
                    onClick={() => fetchAlerts(true)} 
                    loading={refreshing}
                    icon={RefreshCcw}
                    className="bg-white shadow-sm"
                >
                    Refresh Status
                </AppButton>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-[40px]" />)}
                </div>
            ) : totalAlertCount === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[48px] border-2 border-dashed border-slate-100 shadow-xl shadow-slate-200/20">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mb-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Everything is Clear</h2>
                    <p className="font-bold text-slate-400 italic">No critical system alerts detected at this time.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Financial Risks */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                <CreditCard size={18} />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Financial Risks</h4>
                            <span className="ml-auto text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                                {[...alerts.naya, ...alerts.suppliers].length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {[...alerts.naya, ...alerts.suppliers].map((alert, i) => (
                                <AlertItem key={i} alert={alert} />
                            ))}
                            {[...alerts.naya, ...alerts.suppliers].length === 0 && (
                                <div className="p-10 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                    <p className="text-xs font-bold text-slate-400">No financial alerts</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Inventory & Stock */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                <Package size={18} />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inventory & Parked</h4>
                            <span className="ml-auto text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                                {[...alerts.stock, ...alerts.held_bills].length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {[...alerts.stock, ...alerts.held_bills].map((alert, i) => (
                                <AlertItem key={i} alert={alert} />
                            ))}
                            {[...alerts.stock, ...alerts.held_bills].length === 0 && (
                                <div className="p-10 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                    <p className="text-xs font-bold text-slate-400">No inventory alerts</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Operations */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <Activity size={18} />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Kitchen & Cash</h4>
                            <span className="ml-auto text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                                {[...alerts.kitchen, ...alerts.cash].length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {[...alerts.kitchen, ...alerts.cash].map((alert, i) => (
                                <AlertItem key={i} alert={alert} />
                            ))}
                            {[...alerts.kitchen, ...alerts.cash].length === 0 && (
                                <div className="p-10 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                    <p className="text-xs font-bold text-slate-400">No operational alerts</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default SystemAlertsPage;
