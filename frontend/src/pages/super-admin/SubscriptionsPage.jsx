import React, { useState, useEffect } from 'react';
import { 
    CreditCard, Store, AlertTriangle, ShieldOff, 
    CheckCircle2, Clock, TrendingUp, RefreshCw,
    ChevronRight, Plus, Search, X, Loader2,
    DollarSign, Hash, Ban, UserCheck
} from 'lucide-react';
import api from '../../api/apiClient';
import { cn } from '../../utils/cn';
import { useToast } from '../../components/ui/Feedback';

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
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border', cfg.bg, cfg.color, cfg.border)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
        </span>
    );
};

const PaymentModal = ({ shop, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const [form, setForm] = useState({ 
        amount: '', 
        months: 1, 
        days: 7,
        payment_method: 'Cash', 
        reference_no: '', 
        notes: '' 
    });
    const [mode, setMode] = useState('payment'); // 'payment' | 'extend' | 'lock' | 'unlock' | 'grace' | 'suspend'

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let endpoint;
            let body;
            if (mode === 'payment')  { endpoint = `/super-admin/subscriptions/${shop.id}/mark-paid`; body = form; }
            if (mode === 'extend')   { endpoint = `/super-admin/subscriptions/${shop.id}/extend`;  body = { months: form.months, days: form.days, notes: form.notes }; }
            if (mode === 'lock')     { endpoint = `/super-admin/subscriptions/${shop.id}/lock`;    body = { reason: form.notes }; }
            if (mode === 'unlock')   { endpoint = `/super-admin/subscriptions/${shop.id}/unlock`;  body = { notes: form.notes }; }
            if (mode === 'grace')    { endpoint = `/super-admin/subscriptions/${shop.id}/grace`;   body = { days: form.days, note: form.notes }; }
            if (mode === 'suspend')  { endpoint = `/super-admin/subscriptions/${shop.id}/suspend`; body = { reason: form.notes }; }

            const { data } = await api.post(endpoint, body);
            if (data.success) {
                showToast(data.message, 'success');
                onSuccess(data.message);
                onClose();
            }
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Action failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const isLocked = shop.effective_subscription_status === 'locked';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">{shop.name}</h3>
                        <div className="mt-1.5">
                            <StatusBadge status={shop.effective_subscription_status || shop.subscription_status} />
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                {/* Mode tabs */}
                <div className="flex flex-wrap gap-2 mb-8 bg-slate-950/50 p-2 rounded-2xl border border-white/5">
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
                                'flex-1 min-w-[80px] py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1.5',
                                mode === m.id
                                    ? ['lock', 'suspend'].includes(m.id) ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                            )}
                        >
                            <m.icon size={14} />
                            {m.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {mode === 'payment' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Amount Received (Rs.)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="number"
                                        placeholder="e.g. 5000"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all"
                                        value={form.amount}
                                        onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Method</label>
                                <select
                                    className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all text-sm"
                                    value={form.payment_method}
                                    onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Card">Card Payment</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Reference #</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Optional"
                                        className="w-full pl-10 pr-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all text-sm"
                                        value={form.reference_no}
                                        onChange={e => setForm(p => ({ ...p, reference_no: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Extend by (months)</label>
                                <select
                                    className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all text-sm"
                                    value={form.months}
                                    onChange={e => setForm(p => ({ ...p, months: e.target.value }))}
                                >
                                    {[1,2,3,6,12].map(m => <option key={m} value={m}>{m} month{m>1?'s':''}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {mode === 'extend' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Months</label>
                                <select
                                    className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all text-sm"
                                    value={form.months}
                                    onChange={e => setForm(p => ({ ...p, months: e.target.value }))}
                                >
                                    {[0,1,2,3,6,12].map(m => <option key={m} value={m}>{m} month{m!==1?'s':''}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Extra Days</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all text-sm"
                                    value={form.days}
                                    onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'grace' && (
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Add Grace Days</label>
                            <input
                                type="number"
                                className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-all"
                                value={form.days}
                                onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Internal Notes / Reason</label>
                        <textarea
                            rows="2"
                            placeholder="Enter reason or reference details..."
                            className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none"
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || (mode === 'payment' && !form.amount)}
                    className={cn(
                        'w-full mt-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl',
                        ['lock', 'suspend'].includes(mode)
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
                    )}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    {mode === 'payment' ? 'Confirm Payment' : mode === 'extend' ? 'Extend Access' : mode === 'grace' ? 'Grant Grace' : mode === 'lock' ? 'Lock Shop' : mode === 'unlock' ? 'Unlock Shop' : 'Suspend Shop'}
                </button>
            </div>
        </div>
    );
};

const SubscriptionsPage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedShop, setSelectedShop] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { fetchSubscriptions(); }, []);

    const fetchSubscriptions = async () => {
        try {
            const { data } = await api.get('/super-admin/subscriptions');
            if (data.success) setShops(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = (msg) => {
        setSuccessMsg(msg);
        fetchSubscriptions();
        setTimeout(() => setSuccessMsg(''), 4000);
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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Subscriptions</h1>
                    <p className="text-slate-400 mt-1">SaaS Billing & Lifecycle Management</p>
                </div>
                <button onClick={fetchSubscriptions} className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all text-sm font-bold">
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {successMsg && (
                <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
                    <CheckCircle2 size={18} />
                    {successMsg}
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(filter === key ? 'all' : key)}
                        className={cn(
                            'p-4 rounded-[2rem] border transition-all text-left group',
                            filter === key ? `${cfg.bg} ${cfg.border}` : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                        )}
                    >
                        <cfg.icon size={20} className={cn('mb-2', cfg.color)} />
                        <p className="text-2xl font-black text-white">{stats[key] || 0}</p>
                        <p className={cn('text-[9px] font-black uppercase tracking-widest mt-1', cfg.color)}>{cfg.label}</p>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400" size={18} />
                <input
                    type="text"
                    placeholder="Search shops by name or identifier..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Shop & ID</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Effective Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subscription End</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Days Remaining</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Payment</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="animate-spin text-indigo-500" size={28} />
                                        Loading shops...
                                    </div>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="px-8 py-16 text-center text-slate-500">No matching subscriptions found.</td></tr>
                            ) : filtered.map(shop => {
                                const effectiveStatus = shop.effective_subscription_status || shop.subscription_status;
                                const daysLeft = shop.subscription_end_date
                                    ? Math.ceil((new Date(shop.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24))
                                    : null;

                                return (
                                    <tr key={shop.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-black flex items-center justify-center border border-indigo-500/10">
                                                    {shop.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white leading-none">{shop.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-1.5">{shop.identifier}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={effectiveStatus} />
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-400">
                                            {shop.subscription_end_date
                                                ? new Date(shop.subscription_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : shop.trial_ends_at ? `Trial: ${new Date(shop.trial_ends_at).toLocaleDateString()}` : '—'
                                            }
                                        </td>
                                        <td className="px-8 py-6">
                                            {daysLeft !== null ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className={cn(
                                                        'text-sm font-black',
                                                        daysLeft > 30 ? 'text-emerald-400' : daysLeft > 7 ? 'text-amber-400' : 'text-rose-400'
                                                    )}>
                                                        {daysLeft > 0 ? `${daysLeft} days` : `${Math.abs(daysLeft)} days ago`}
                                                    </span>
                                                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={cn('h-full transition-all', daysLeft > 30 ? 'bg-emerald-500' : daysLeft > 7 ? 'bg-amber-500' : 'bg-rose-500')}
                                                            style={{ width: `${Math.min(100, Math.max(0, (daysLeft/30)*100))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : <span className="text-slate-600">—</span>}
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-400">
                                            {shop.last_payment_date
                                                ? <div className="flex flex-col">
                                                    <span className="text-white font-bold">Rs. {parseFloat(shop.last_payment_amount || 0).toLocaleString()}</span>
                                                    <span className="text-slate-500 text-[10px] mt-0.5">{new Date(shop.last_payment_date).toLocaleDateString('en-GB')}</span>
                                                </div>
                                                : '—'
                                            }
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setSelectedShop(shop)}
                                                className="flex items-center gap-2 ml-auto px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/20 hover:border-indigo-600 rounded-xl text-indigo-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-900/20"
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

            {selectedShop && (
                <PaymentModal
                    shop={selectedShop}
                    onClose={() => setSelectedShop(null)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

export default SubscriptionsPage;
