import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ChevronLeft, 
    ShieldCheck, 
    Zap, 
    CreditCard, 
    TrendingUp, 
    Clock, 
    ShieldOff, 
    Ban, 
    UserCheck,
    CheckCircle2,
    Activity,
    Cpu,
    Calendar,
    Wallet,
    History,
    MessageSquare,
    AlertTriangle,
    DollarSign,
    Sparkles,
    Loader2
} from 'lucide-react';
import api from '../../api/apiClient';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

const ShopAccessGovernancePage = () => {
    const { identifier } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('payment');
    const [modalLoading, setModalLoading] = useState(false);

    // Form State
    const [form, setForm] = useState({ 
        amount: '', 
        months: 1, 
        days: 7,
        payment_method: 'Cash', 
        reference_no: '', 
        notes: '' 
    });

    useEffect(() => {
        fetchShop();
    }, [identifier]);

    const fetchShop = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/super-admin/shops/${identifier}`);
            if (data.success) {
                setShop(data.data);
            }
        } catch (err) {
            console.error(err);
            showToast('Neural link failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setModalLoading(true);
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
                fetchShop();
            }
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Protocol failure', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Accessing Governance Core...</p>
        </div>
    );

    const isLocked = shop?.effective_subscription_status === 'locked';

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Cyber Header */}
            <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 p-12 rounded-[4rem] backdrop-blur-3xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <Link 
                            to="/super-admin/subscriptions"
                            className="p-5 bg-white/5 hover:bg-white/10 rounded-[2rem] text-slate-400 hover:text-white transition-all border border-white/5 group"
                        >
                            <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <ShieldCheck className="text-indigo-500" size={24} />
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Node Access Control</p>
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tighter">
                                {shop?.name} <span className="text-slate-700">/</span> Governance
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="px-8 py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] backdrop-blur-xl">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">Status Protocol</p>
                            <p className="text-2xl font-black text-white uppercase tracking-tighter">{shop?.effective_subscription_status || shop?.subscription_status}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left: Controls */}
                <div className="lg:col-span-7 space-y-12">
                    <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                        
                        <div className="relative mb-12">
                            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
                                <Zap className="text-indigo-500" size={32} />
                                Governance Command
                            </h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Execute administrative protocols for node access</p>
                        </div>

                        {/* Mode Matrix */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-950/40 p-4 rounded-[3rem] border border-white/5 mb-12">
                            {[
                                { id: 'payment', label: 'Payment', icon: CreditCard, desc: 'Renew access' },
                                { id: 'extend', label: 'Extend', icon: TrendingUp, desc: 'Temporal offset' },
                                { id: 'grace', label: 'Grace', icon: Clock, desc: 'Safety window' },
                                { id: isLocked ? 'unlock' : 'lock', label: isLocked ? 'Unlock' : 'Lock', icon: isLocked ? UserCheck : ShieldOff, desc: 'Access state' },
                                { id: 'suspend', label: 'Suspend', icon: Ban, desc: 'De-provision' },
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={cn(
                                        'py-6 px-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-3 border',
                                        mode === m.id
                                            ? ['lock', 'suspend'].includes(m.id) 
                                                ? 'bg-rose-600 border-rose-500 text-white shadow-xl shadow-rose-900/30' 
                                                : 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-900/30'
                                            : 'bg-white/5 border-transparent text-slate-500 hover:text-white hover:bg-white/10'
                                    )}
                                >
                                    <m.icon size={24} />
                                    <div className="text-center">
                                        <p className="mb-1">{m.label}</p>
                                        <p className="text-[7px] opacity-40 lowercase font-bold">{m.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Form Body */}
                        <div className="space-y-8">
                            {mode === 'payment' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Capital Injection (LKR)</label>
                                        <div className="relative group">
                                            <div className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-xl">Rs.</div>
                                            <input
                                                type="number"
                                                className="w-full pl-20 pr-8 py-7 bg-slate-950 border border-white/5 rounded-[2.5rem] text-white font-black text-4xl focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-900"
                                                placeholder="0.00"
                                                value={form.amount}
                                                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Transfer Protocol</label>
                                        <select
                                            className="w-full px-8 py-5 bg-slate-950 border border-white/5 rounded-[2rem] text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                                            value={form.payment_method}
                                            onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                                        >
                                            <option value="Cash">Physical Liquidity</option>
                                            <option value="Bank Transfer">Neural Wire</option>
                                            <option value="Card">Digital Ledger</option>
                                            <option value="Other">External Flow</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Temporal Quantum (Months)</label>
                                        <select
                                            className="w-full px-8 py-5 bg-slate-950 border border-white/5 rounded-[2rem] text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                                            value={form.months}
                                            onChange={e => setForm(p => ({ ...p, months: e.target.value }))}
                                        >
                                            {[1,2,3,6,12].map(m => <option key={m} value={m}>{m} Month Registry</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {mode === 'extend' && (
                                <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Expansion (Months)</label>
                                        <select
                                            className="w-full px-8 py-5 bg-slate-950 border border-white/5 rounded-[2rem] text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                                            value={form.months}
                                            onChange={e => setForm(p => ({ ...p, months: e.target.value }))}
                                        >
                                            {[0,1,2,3,6,12].map(m => <option key={m} value={m}>{m} Month Offset</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Day Buffer</label>
                                        <input
                                            type="number"
                                            className="w-full px-8 py-5 bg-slate-950 border border-white/5 rounded-[2rem] text-white font-black focus:outline-none focus:border-indigo-500 transition-all"
                                            value={form.days}
                                            onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {mode === 'grace' && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Provision Grace Buffer (Days)</label>
                                    <input
                                        type="number"
                                        className="w-full px-10 py-7 bg-slate-950 border border-white/5 rounded-[2.5rem] text-white font-black text-3xl focus:outline-none focus:border-indigo-500 transition-all"
                                        value={form.days}
                                        onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Administrative Protocol Note</label>
                                <textarea
                                    rows="4"
                                    placeholder="Enter exhaustive justification for this state change..."
                                    className="w-full px-8 py-7 bg-slate-950 border border-white/5 rounded-[3rem] text-white font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none text-sm leading-relaxed"
                                    value={form.notes}
                                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={modalLoading || (mode === 'payment' && !form.amount)}
                                className={cn(
                                    'w-full py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl active:scale-[0.98]',
                                    ['lock', 'suspend'].includes(mode)
                                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                                )}
                            >
                                {modalLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                                Finalize {mode} Protocol
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: State Intelligence */}
                <div className="lg:col-span-5 space-y-12">
                    {/* Status Overview Card */}
                    <div className="p-10 bg-slate-900/60 border border-white/5 rounded-[4rem] backdrop-blur-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full -mr-20 -mt-20"></div>
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-4 mb-8">
                            <Activity className="text-emerald-500" size={24} />
                            Node Intelligence
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-950/40 border border-white/5 rounded-[2.5rem]">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Temporal Health</p>
                                <div className="flex items-end justify-between">
                                    <h4 className="text-3xl font-black text-white tabular-nums">
                                        {shop?.subscription_end_date ? Math.ceil((new Date(shop.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24)) : '0'} <span className="text-sm text-slate-600 uppercase">Days</span>
                                    </h4>
                                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] w-2/3" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-950/40 border border-white/5 rounded-[2.5rem]">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Revenue History</p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Last Payment</p>
                                        <p className="text-xl font-black text-white">Rs. {parseFloat(shop?.last_payment_amount || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Registry Date</p>
                                        <p className="text-sm font-black text-slate-400">{shop?.last_payment_date ? new Date(shop.last_payment_date).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Audit Trail Section */}
                    <div className="p-10 bg-slate-900/60 border border-white/5 rounded-[4rem] backdrop-blur-3xl flex-1">
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-4 mb-8">
                            <History className="text-indigo-500" size={24} />
                            Audit Registry
                        </h3>
                        
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-6 relative group/audit">
                                    {i !== 3 && <div className="absolute left-4 top-8 bottom-0 w-[1px] bg-white/5" />}
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                        <MessageSquare size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">May 16, 2026 19:42</p>
                                        <p className="text-sm font-bold text-slate-300 leading-relaxed">
                                            Admin provisioned 30-day grace period due to banking infrastructure downtime.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <Link 
                            to={`/super-admin/audit-logs?search=${shop?.name || ''}`}
                            className="w-full mt-10 py-5 bg-white/5 hover:bg-white/10 rounded-[2rem] border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all block text-center"
                        >
                            View Full Node Ledger
                        </Link>
                    </div>

                    {/* Critical Warning */}
                    <div className="p-10 bg-rose-500/10 border border-rose-500/20 rounded-[4rem] flex items-center gap-8 group">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-110 transition-transform">
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-white tracking-tight">Security Protocol Notice</h4>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 leading-relaxed">
                                All governance actions are irreversible and recorded in the immutable platform ledger for compliance monitoring.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopAccessGovernancePage;
