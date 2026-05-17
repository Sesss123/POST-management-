import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../api/api';
import { 
    Zap, 
    Search, 
    Calendar, 
    ShoppingBag, 
    Printer, 
    Eye, 
    ChevronRight,
    Clock,
    User,
    Package,
    Sparkles,
    RefreshCw,
    History,
    TrendingUp,
    Filter
} from 'lucide-react';
import { 
    AppButton, 
    useToast, 
    ResponsiveDataList 
} from '../components/ui';
import { cn } from '../utils/cn';

const GlassCard = ({ title, value, icon: Icon, variant = 'primary', className }) => {
    const variants = {
        primary: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
        success: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
        warning: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    };

    const iconColors = {
        primary: "text-indigo-400",
        success: "text-emerald-400",
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
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white tabular-nums tracking-tighter">
                    {value}
                </h4>
            </div>
        </div>
    );
};

const QuickRetailHistoryPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await invoiceApi.getQuickHistory();
            setInvoices(data.data);
        } catch (err) {
            toast.error('Failed to load quick retail history');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoice_no.toLowerCase().includes(search.toLowerCase());
        const invDate = new Date(inv.created_at).toISOString().split('T')[0];
        const matchesDate = !date || invDate === date;
        return matchesSearch && matchesDate;
    });

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);
    const totalSales = filteredInvoices.length;

    const formatCurrency = (val) => {
        return `Rs. ${parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20 p-2 sm:p-6 lg:p-8 selection:bg-indigo-500/30">
            {/* Header */}
            <header className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 rounded-[48px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-slate-900/80 backdrop-blur-3xl p-10 rounded-[44px] border border-white/10 shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
                            <History size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-indigo-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Transaction History</span>
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tight leading-none mb-1 uppercase">No-Bill Records</h2>
                            <p className="text-sm font-medium text-slate-400">Archived Quick Retail sales and system-generated logs</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                        <div className="flex bg-slate-800/50 p-1.5 rounded-[24px] border border-white/5 shadow-inner">
                            <div className="flex items-center gap-3 px-5 py-2.5">
                                <Calendar size={18} className="text-indigo-400" />
                                <input 
                                    type="date" 
                                    className="bg-transparent font-black text-xs outline-none text-white focus:text-indigo-400 transition-colors cursor-pointer"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <AppButton 
                                variant="secondary" 
                                icon={RefreshCw} 
                                size="lg" 
                                className="rounded-[20px] bg-slate-800 border-white/5 text-white hover:text-indigo-400" 
                                onClick={fetchHistory} 
                                loading={loading}
                            >
                                Sync
                            </AppButton>
                        </div>
                    </div>
                </div>
            </header>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <GlassCard 
                    title="Total Revenue" 
                    value={formatCurrency(totalRevenue)} 
                    icon={TrendingUp} 
                    variant="success" 
                />
                <GlassCard 
                    title="Total Sales" 
                    value={totalSales} 
                    icon={ShoppingBag} 
                    variant="primary" 
                />
                <GlassCard 
                    title="Average Basket" 
                    value={formatCurrency(totalSales > 0 ? totalRevenue / totalSales : 0)} 
                    icon={Zap} 
                    variant="warning" 
                />
            </div>

            {/* List Table */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[44px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[44px] overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight uppercase">Activity Ledger</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time sale protocols</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Filter invoice no..." 
                                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <ResponsiveDataList 
                            loading={loading}
                            data={filteredInvoices}
                            headers={[
                                { label: 'Sale Protocol' },
                                { label: 'Timeline' },
                                { label: 'Actor' },
                                { label: 'Payment' },
                                { label: 'Amount', className: 'text-right' },
                                { label: 'Action', className: 'text-right' }
                            ]}
                            renderRow={(inv) => (
                                <tr key={inv.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                <ShoppingBag size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-white uppercase tracking-tight">{inv.invoice_no}</p>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">No-Bill Protocol</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <Clock size={16} className="text-slate-500" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black">{new Date(inv.created_at).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-black text-slate-500 uppercase">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black border border-white/10">
                                                {inv.created_by_name?.charAt(0) || 'S'}
                                            </div>
                                            <span className="text-sm font-bold">{inv.created_by_name || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                            {inv.payment_method}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <span className="text-lg font-black text-white tabular-nums tracking-tight">
                                            {formatCurrency(inv.grand_total)}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <AppButton 
                                            variant="ghost" 
                                            size="sm" 
                                            icon={Eye} 
                                            className="rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                                            onClick={() => navigate(`/invoices/${inv.uuid || inv.id}`)}
                                        >
                                            View
                                        </AppButton>
                                    </td>
                                </tr>
                            )}
                            renderCard={(inv) => (
                                <div key={inv.id} className="p-8 space-y-6 bg-slate-900/40 border-b border-white/5 last:border-0 group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                                <Zap size={24} />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-white tracking-tight uppercase">{inv.invoice_no}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {new Date(inv.created_at).toLocaleDateString()} • {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-indigo-400">{formatCurrency(inv.grand_total)}</p>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{inv.payment_method}</span>
                                        </div>
                                    </div>
                                    <AppButton 
                                        variant="secondary" 
                                        size="lg" 
                                        className="w-full rounded-[20px] bg-slate-800 text-white border-white/5 hover:bg-slate-700" 
                                        icon={Eye} 
                                        onClick={() => navigate(`/invoices/${inv.uuid || inv.id}`)}
                                    >
                                        Protocol Details
                                    </AppButton>
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickRetailHistoryPage;
