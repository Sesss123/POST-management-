import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    CreditCard, Store, AlertTriangle, ShieldOff, 
    CheckCircle2, Clock, TrendingUp, RefreshCw,
    ChevronRight, Plus, Search, X, Loader2,
    DollarSign, Hash, Ban, UserCheck, Activity,
    Calendar, Sparkles, Filter, ArrowUpRight,
    ArrowDownRight, Wallet, History, Zap,
    Mail, Phone, ExternalLink, Timer
} from 'lucide-react';
import api from '../../api/apiClient';
import { cn } from '../../utils/cn';
import { useToast } from '../../components/ui/Feedback';
import { AppModal } from '../../components/ui';

const STATUS_CONFIG = {
    trial:      { label: 'Trial',       color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     dot: 'bg-sky-400',     icon: Clock },
    active:     { label: 'Active',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', icon: CheckCircle2 },
    grace:      { label: 'Grace',       color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400',   icon: Clock },
    restricted: { label: 'Restricted',  color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    dot: 'bg-rose-500',    icon: AlertTriangle },
    locked:     { label: 'Locked',      color: 'text-slate-500',   bg: 'bg-slate-800/50',   border: 'border-slate-700',      dot: 'bg-slate-600',   icon: ShieldOff },
    suspended:  { label: 'Suspended',   color: 'text-rose-600',    bg: 'bg-rose-950/20',    border: 'border-rose-900',      dot: 'bg-rose-700',    icon: Ban },
    cancelled:  { label: 'Cancelled',   color: 'text-slate-600',   bg: 'bg-slate-900',      border: 'border-slate-800',      dot: 'bg-slate-700',    icon: X },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', cfg.bg, cfg.color, cfg.border)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
        </span>
    );
};

const SubscriptionsPage = () => {
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedShop, setSelectedShop] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    // Modal Form State
    const [form, setForm] = useState({ 
        amount: '', 
        months: 1, 
        days: 7,
        payment_method: 'Cash', 
        reference_no: '', 
        notes: '' 
    });
    const [mode, setMode] = useState('payment');
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => { fetchSubscriptions(); }, []);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/super-admin/subscriptions');
            if (data.success) setShops(data.data);
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch subscriptions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleModalSubmit = async () => {
        setModalLoading(true);
        try {
            let endpoint;
            let body;
            if (mode === 'payment')  { endpoint = `/super-admin/subscriptions/${selectedShop.id}/mark-paid`; body = form; }
            if (mode === 'extend')   { endpoint = `/super-admin/subscriptions/${selectedShop.id}/extend`;  body = { months: form.months, days: form.days, notes: form.notes }; }
            if (mode === 'lock')     { endpoint = `/super-admin/subscriptions/${selectedShop.id}/lock`;    body = { reason: form.notes }; }
            if (mode === 'unlock')   { endpoint = `/super-admin/subscriptions/${selectedShop.id}/unlock`;  body = { notes: form.notes }; }
            if (mode === 'grace')    { endpoint = `/super-admin/subscriptions/${selectedShop.id}/grace`;   body = { days: form.days, note: form.notes }; }
            if (mode === 'suspend')  { endpoint = `/super-admin/subscriptions/${selectedShop.id}/suspend`; body = { reason: form.notes }; }

            const { data } = await api.post(endpoint, body);
            if (data.success) {
                showToast(data.message, 'success');
                setIsModalOpen(false);
                fetchSubscriptions();
            }
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Action failed', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const filtered = shops.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.identifier?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || (s.effective_subscription_status || s.subscription_status) === filter;
        return matchSearch && matchFilter;
    });

    const stats = shops.reduce((acc, s) => {
        const st = s.effective_subscription_status || s.subscription_status;
        acc[st] = (acc[st] || 0) + 1;
        return acc;
    }, {});

    const totalRevenue = shops.reduce((sum, s) => sum + parseFloat(s.last_payment_amount || 0), 0);
    const expiringSoon = shops.filter(s => {
        const days = s.subscription_end_date ? Math.ceil((new Date(s.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 999;
        return days >= 0 && days <= 7;
    });

    const isLocked = selectedShop?.effective_subscription_status === 'locked';

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Cyber Header & Revenue Matrix */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 relative overflow-hidden bg-slate-900/40 border border-white/5 p-12 rounded-[4rem] backdrop-blur-3xl">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse"></div>
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <Zap className="text-indigo-500 animate-pulse" size={24} />
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">SaaS Billing Ecosystem</p>
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tighter">Subscriptions</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-3 leading-relaxed">
                                Managing {shops.length} nodes <span className="mx-2 text-slate-800">|</span> 
                                <span className="text-emerald-500"> {stats.active || 0} Healthy</span> <span className="mx-2 text-slate-800">|</span> 
                                <span className="text-rose-500"> {expiringSoon.length} Critical</span>
                            </p>
                        </div>
                        <button 
                            onClick={fetchSubscriptions} 
                            className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[2rem] text-slate-400 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em]"
                        >
                            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                            Synch Nodes
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-indigo-600 border border-indigo-500 p-12 rounded-[4rem] shadow-2xl shadow-indigo-900/20 group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-1000"></div>
                    <div className="relative h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="w-16 h-16 rounded-[2rem] bg-white/20 flex items-center justify-center text-white backdrop-blur-xl">
                                <Wallet size={32} />
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Growth Index</p>
                                <div className="flex items-center gap-1 text-emerald-300 font-black">
                                    <ArrowUpRight size={16} />
                                    <span>12.4%</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-2">Total Node Revenue</p>
                            <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums">
                                Rs. {totalRevenue.toLocaleString()}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Critical Operations Widget (Proper Implementation) */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-amber-600 rounded-[4.2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-slate-900 border border-white/10 rounded-[4rem] p-12 backdrop-blur-3xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <Timer size={120} className="text-white" />
                    </div>
                    
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Critical Expirations Protocol</h3>
                            </div>
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Nodes scheduled for suspension within the 168-hour temporal window</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Impact Level</p>
                                <p className="text-xl font-black text-white tabular-nums">{expiringSoon.length} Shop Nodes</p>
                            </div>
                            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                                Expand Registry
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {expiringSoon.length > 0 ? expiringSoon.slice(0, 4).map(s => {
                            const days = Math.ceil((new Date(s.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24));
                            return (
                                <div key={s.id} className="relative group/card">
                                    <div className="p-8 bg-slate-950/60 border border-white/5 rounded-[3rem] transition-all duration-500 hover:bg-slate-950 hover:border-rose-500/30">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center font-black text-white text-xl">
                                                {s.name.charAt(0)}
                                            </div>
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                                                days <= 2 ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            )}>
                                                {days}d Left
                                            </div>
                                        </div>
                                        
                                        <div className="mb-8">
                                            <h4 className="text-lg font-black text-white truncate mb-1">{s.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.identifier}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => navigate(`/super-admin/shops/${s.identifier}/governance`)}
                                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20"
                                            >
                                                Renew
                                            </button>
                                            <button className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all">
                                                <Mail size={14} />
                                            </button>
                                            <button className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all">
                                                <Phone size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-4 py-16 flex flex-col items-center justify-center gap-4 bg-slate-950/20 rounded-[3rem] border border-dashed border-white/5">
                                <CheckCircle2 className="text-emerald-500/30" size={48} />
                                <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">All nodes operating within temporal safety margins</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Stat Matrix (Filters) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(filter === key ? 'all' : key)}
                        className={cn(
                            'p-8 rounded-[2.5rem] border transition-all duration-500 text-left group relative overflow-hidden',
                            filter === key ? `${cfg.bg} ${cfg.border} shadow-2xl` : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                        )}
                    >
                        <cfg.icon size={24} className={cn('mb-4 transition-transform group-hover:scale-110', cfg.color)} />
                        <p className="text-3xl font-black text-white tabular-nums">{stats[key] || 0}</p>
                        <p className={cn('text-[10px] font-black uppercase tracking-widest mt-1', cfg.color)}>{cfg.label}</p>
                    </button>
                ))}
            </div>

            {/* Operations Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search shops by name or unique identifier..."
                        className="w-full pl-16 pr-6 py-5 bg-slate-900/50 border border-white/5 rounded-[2rem] text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-bold"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 bg-slate-900/50 border border-white/5 p-2 rounded-[2rem]">
                    <button className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                        CSV Export
                    </button>
                    <div className="w-[1px] h-6 bg-white/5" />
                    <button className="p-3 text-slate-500 hover:text-white transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Neural Table container */}
            <div className="bg-slate-900/50 border border-white/5 rounded-[4rem] overflow-hidden backdrop-blur-sm relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Shop Identity</th>
                                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Access Protocol</th>
                                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Expiration Matrix</th>
                                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Temporal Delta</th>
                                <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Last Capital Stream</th>
                                <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="6" className="px-10 py-32 text-center">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Scanning subscription nodes...</p>
                                    </div>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="px-10 py-32 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                        <Store size={48} />
                                        <p className="text-xl font-black uppercase tracking-tighter">No subscription nodes matched search</p>
                                    </div>
                                </td></tr>
                            ) : filtered.map(shop => {
                                const effectiveStatus = shop.effective_subscription_status || shop.subscription_status;
                                const daysLeft = shop.subscription_end_date
                                    ? Math.ceil((new Date(shop.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24))
                                    : null;

                                return (
                                    <tr key={shop.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 font-black flex items-center justify-center border border-indigo-500/10 text-xl group-hover:scale-110 transition-transform duration-500">
                                                    {shop.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{shop.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">{shop.identifier}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <StatusBadge status={effectiveStatus} />
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={16} className="text-slate-600" />
                                                <p className="text-sm font-bold text-slate-300">
                                                    {shop.subscription_end_date
                                                        ? new Date(shop.subscription_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                                        : shop.trial_ends_at ? `Trial: ${new Date(shop.trial_ends_at).toLocaleDateString()}` : '—'
                                                    }
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            {daysLeft !== null ? (
                                                <div className="flex flex-col gap-2">
                                                    <span className={cn(
                                                        'text-xs font-black uppercase tracking-widest',
                                                        daysLeft > 30 ? 'text-emerald-400' : daysLeft > 7 ? 'text-amber-400' : 'text-rose-400'
                                                    )}>
                                                        {daysLeft > 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days expired`}
                                                    </span>
                                                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={cn('h-full transition-all duration-1000', daysLeft > 30 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : daysLeft > 7 ? 'bg-amber-500' : 'bg-rose-500')}
                                                            style={{ width: `${Math.min(100, Math.max(0, (daysLeft/30)*100))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : <span className="text-slate-600">—</span>}
                                        </td>
                                        <td className="px-8 py-8">
                                            {shop.last_payment_date
                                                ? <div className="flex flex-col gap-1">
                                                    <span className="text-white font-black text-lg tabular-nums">Rs. {parseFloat(shop.last_payment_amount || 0).toLocaleString()}</span>
                                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{new Date(shop.last_payment_date).toLocaleDateString('en-GB')}</span>
                                                </div>
                                                : <span className="text-slate-700 text-xs font-bold uppercase tracking-widest italic">No Payments Found</span>
                                            }
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button
                                                onClick={() => navigate(`/super-admin/shops/${shop.identifier}/governance`)}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-indigo-600 border border-white/5 hover:border-indigo-500 rounded-2xl text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-indigo-600/20"
                                            >
                                                Manage
                                                <ChevronRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Governance Modal */}
            <AppModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Access Governance: ${selectedShop?.name}`}
                maxWidth="2xl"
            >
                <div className="space-y-8 p-4">
                    {/* Mode Matrix */}
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 bg-slate-950/50 p-2 rounded-3xl border border-white/5">
                        {[
                          { id: 'payment', label: 'Payment', icon: CreditCard },
                          { id: 'extend', label: 'Extend', icon: TrendingUp },
                          { id: 'grace', label: 'Grace', icon: Clock },
                          { id: isLocked ? 'unlock' : 'lock', label: isLocked ? 'Unlock' : 'Lock', icon: isLocked ? UserCheck : ShieldOff },
                          { id: 'suspend', label: 'Suspend', icon: Ban },
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={cn(
                                    'py-4 px-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2',
                                    mode === m.id
                                        ? ['lock', 'suspend'].includes(m.id) ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                                )}
                            >
                                <m.icon size={18} />
                                {m.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        {mode === 'payment' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Amount Received (LKR)</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 font-black">Rs.</div>
                                        <input
                                            type="number"
                                            className="w-full pl-16 pr-6 py-5 bg-slate-950 border border-white/5 rounded-2xl text-white font-black text-2xl focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-800"
                                            placeholder="0.00"
                                            value={form.amount}
                                            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Payment Protocol</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all text-xs"
                                        value={form.payment_method}
                                        onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                                    >
                                        <option value="Cash">Cash Liquidity</option>
                                        <option value="Bank Transfer">Bank Wire</option>
                                        <option value="Card">Digital Checkout</option>
                                        <option value="Other">Special Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Temporal Extension</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all text-xs"
                                        value={form.months}
                                        onChange={e => setForm(p => ({ ...p, months: e.target.value }))}
                                    >
                                        {[1,2,3,6,12].map(m => <option key={m} value={m}>{m} Month{m>1?'s':''} Protocol</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {mode === 'extend' && (
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Months Extension</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all text-xs"
                                        value={form.months}
                                        onChange={e => setForm(p => ({ ...p, months: e.target.value }))}
                                    >
                                        {[0,1,2,3,6,12].map(m => <option key={m} value={m}>{m} month{m!==1?'s':''}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Temporal Offset (Days)</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all text-xs"
                                        value={form.days}
                                        onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}

                        {mode === 'grace' && (
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Provision Grace Period (Days)</label>
                                <input
                                    type="number"
                                    className="w-full px-6 py-5 bg-slate-950 border border-white/5 rounded-2xl text-white font-black text-xl focus:outline-none focus:border-indigo-500 transition-all"
                                    value={form.days}
                                    onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Neural Audit Note</label>
                            <textarea
                                rows="3"
                                placeholder="Enter administrative justification or reference details..."
                                className="w-full px-6 py-5 bg-slate-950 border border-white/5 rounded-3xl text-white font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none text-sm leading-relaxed"
                                value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl transition-all"
                        >
                            Abort
                        </button>
                        <button
                            onClick={handleModalSubmit}
                            disabled={modalLoading || (mode === 'payment' && !form.amount)}
                            className={cn(
                                'flex-[2] py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl active:scale-95',
                                ['lock', 'suspend'].includes(mode)
                                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                            )}
                        >
                            {modalLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} />}
                            Finalize {mode.toUpperCase()} Protocol
                        </button>
                    </div>
                </div>
            </AppModal>
        </div>
    );
};

export default SubscriptionsPage;
