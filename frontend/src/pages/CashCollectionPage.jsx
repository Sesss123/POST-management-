import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  RefreshCw, 
  Download, 
  ChevronRight,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Sparkles,
  Zap,
  Clock,
  Activity
} from 'lucide-react';
import { reportApi } from '../api/api';
import { 
  AppButton, 
  useToast 
} from '../components/ui';
import { cn } from '../utils/cn';

const GlassCard = ({ title, value, icon: Icon, trend, trendValue, variant = 'primary', className }) => {
    const variants = {
        primary: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
        success: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
        danger: "from-rose-500/20 to-orange-500/20 border-rose-500/30",
        warning: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
    };

    const iconColors = {
        primary: "text-indigo-400",
        success: "text-emerald-400",
        danger: "text-rose-400",
        warning: "text-amber-400",
    };

    return (
        <div className={cn(
            "relative group overflow-hidden bg-slate-900/40 backdrop-blur-2xl border rounded-[40px] p-8 transition-all duration-500 hover:scale-[1.02]",
            variants[variant],
            className
        )}>
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className={cn("w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center", iconColors[variant])}>
                        <Icon size={28} />
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5",
                            trend === 'up' ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {trendValue}
                        </div>
                    )}
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white tabular-nums tracking-tighter">
                    {value}
                </h4>
            </div>
        </div>
    );
};

const CashCollectionPage = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await reportApi.getCashCollection(dateRange);
            if (response.data && response.data.success) {
                setData(response.data.data);
            } else {
                toast.error('Failed to parse cash collection data');
            }
        } catch (error) {
            console.error('Failed to fetch cash collection:', error);
            toast.error('Network error while loading cash collection');
        } finally {
            setLoading(false);
        }
    }, [dateRange, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (val) => {
        const amount = parseFloat(val || 0);
        return `Rs. ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const summary = data?.summary || { total_sales_cash: 0, total_debt_cash: 0, total_cash_out: 0, net_cash: 0 };
    const transactions = data?.transactions || [];

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20 p-2 sm:p-6 lg:p-8 selection:bg-emerald-500/30">
            {/* Header section */}
            <header className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-500 rounded-[48px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-slate-900/80 backdrop-blur-3xl p-10 rounded-[44px] border border-white/10 shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 group-hover:scale-110 transition-transform duration-500">
                            <Wallet size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Financial Intelligence</span>
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tight leading-none mb-1 uppercase">Cash Flow</h2>
                            <p className="text-sm font-medium text-slate-400">Physical drawer movements and drawer telemetry</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                        <div className="flex bg-slate-800/50 p-1.5 rounded-[24px] border border-white/5 shadow-inner">
                            <div className="flex items-center gap-3 px-5 py-2.5">
                                <Calendar size={18} className="text-emerald-400" />
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        className="bg-transparent font-black text-xs outline-none text-white focus:text-emerald-400 transition-colors cursor-pointer"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                                    />
                                    <span className="text-slate-600 font-bold">to</span>
                                    <input 
                                        type="date" 
                                        className="bg-transparent font-black text-xs outline-none text-white focus:text-emerald-400 transition-colors cursor-pointer"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <AppButton 
                                variant="secondary" 
                                icon={RefreshCw} 
                                size="lg" 
                                className="rounded-[20px] bg-slate-800 border-white/5 text-white hover:text-emerald-400" 
                                onClick={fetchData} 
                                loading={loading}
                            >
                                Sync
                            </AppButton>
                        </div>
                    </div>
                </div>
            </header>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <GlassCard 
                    title="Sales Revenue" 
                    value={formatCurrency(summary.total_sales_cash)} 
                    icon={TrendingUp} 
                    variant="success" 
                    trend="up" 
                    trendValue="Direct POS"
                />
                <GlassCard 
                    title="Debt Recovered" 
                    value={formatCurrency(summary.total_debt_cash)} 
                    icon={DollarSign} 
                    variant="primary" 
                    trend="up" 
                    trendValue="Naya Paid"
                />
                <GlassCard 
                    title="Drawer Payouts" 
                    value={formatCurrency(summary.total_cash_out)} 
                    icon={ArrowDownRight} 
                    variant="danger" 
                    trend="down" 
                    trendValue="Expenses"
                />
                <GlassCard 
                    title="Net Drawer Cash" 
                    value={formatCurrency(summary.net_cash)} 
                    icon={Wallet} 
                    variant="warning" 
                    className="border-amber-500/50 bg-amber-500/10 shadow-2xl shadow-amber-500/10"
                />
            </div>

            {/* Detailed Transaction Ledger */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[44px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[44px] overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight uppercase">Audit Ledger</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time movement history</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Filter reference..." 
                                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-800/30">
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timeline</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Classification</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Reference Protocol</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Amount (LKR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan="4" className="px-10 py-6">
                                                <div className="h-8 bg-white/5 rounded-xl animate-pulse" />
                                            </td>
                                        </tr>
                                    ))
                                ) : transactions.length > 0 ? transactions.map((tx, idx) => (
                                    <tr key={idx} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <Clock size={16} className="text-slate-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-300 group-hover:text-white transition-colors">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase">
                                                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                                    tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                )}>
                                                    <Activity size={18} />
                                                </div>
                                                <span className="text-sm font-black text-white uppercase tracking-tight">{tx.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{tx.reference || 'SYSTEM_GEN'}</span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <span className={cn(
                                                "text-lg font-black tabular-nums tracking-tight",
                                                tx.amount > 0 ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Zap size={64} className="text-slate-400" />
                                                <p className="text-lg font-black uppercase tracking-widest text-slate-400">No Drawer Movements Recorded</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashCollectionPage;
