import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { superAdminApi } from '../../api/api';
import { 
    ChevronLeft, 
    Megaphone, 
    Send, 
    Sparkles, 
    Target, 
    Clock, 
    Calendar,
    Eye,
    ShieldAlert,
    AlertTriangle,
    Zap,
    Info,
    History,
    LayoutGrid,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Smartphone,
    Terminal
} from 'lucide-react';
import { AppButton, useToast } from '../../components/ui';
import { cn } from '../../utils/cn';

const CreateAnnouncementPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [form, setForm] = useState({
        title: '',
        message: '',
        type: 'info',
        target_shop_id: '',
        expires_at: ''
    });

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const { data } = await superAdminApi.getShops();
            if (data.success) setShops(data.data);
        } catch (err) {}
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!form.title || !form.message) {
            toast.error('Protocol data incomplete');
            return;
        }

        setLoading(true);
        try {
            await superAdminApi.createAnnouncement({
                ...form,
                target_shop_id: form.target_shop_id || null,
                expires_at: form.expires_at || null
            });
            toast.success('Broadcast Synchronized with Network');
            navigate('/super-admin/announcements');
        } catch (err) {
            toast.error('Transmission failure');
        } finally {
            setLoading(false);
        }
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'urgent': return { 
                icon: ShieldAlert, 
                color: 'text-rose-500', 
                bg: 'bg-rose-500/10', 
                border: 'border-rose-500/20',
                glow: 'shadow-rose-900/40',
                label: 'Critical Alert'
            };
            case 'warning': return { 
                icon: AlertTriangle, 
                color: 'text-amber-500', 
                bg: 'bg-amber-500/10', 
                border: 'border-amber-500/20',
                glow: 'shadow-amber-900/40',
                label: 'System Warning'
            };
            case 'success': return { 
                icon: Zap, 
                color: 'text-emerald-500', 
                bg: 'bg-emerald-500/10', 
                border: 'border-emerald-500/20',
                glow: 'shadow-emerald-900/40',
                label: 'Evolution Update'
            };
            default: return { 
                icon: Info, 
                color: 'text-indigo-500', 
                bg: 'bg-indigo-500/10', 
                border: 'border-indigo-500/20',
                glow: 'shadow-indigo-900/40',
                label: 'Global Info'
            };
        }
    };

    const config = getTypeConfig(form.type);

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Cyber Header */}
            <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 p-12 rounded-[4rem] backdrop-blur-3xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -mr-40 -mt-40"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <Link 
                            to="/super-admin/announcements"
                            className="p-5 bg-white/5 hover:bg-white/10 rounded-[2rem] text-slate-400 hover:text-white transition-all border border-white/5 group"
                        >
                            <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <Megaphone className="text-indigo-500" size={24} />
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Broadcast Workspace</p>
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tighter">New Transmission</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-4 px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-900/40 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            Initiate Broadcast
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* Configuration Workspace */}
                <div className="xl:col-span-7 space-y-12">
                    <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] backdrop-blur-sm space-y-12">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                                <Terminal className="text-indigo-500" size={24} />
                                Protocol Definition
                            </h2>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Neural Link Active</span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Announcement Title</label>
                                <input
                                    type="text"
                                    className="w-full px-10 py-6 bg-slate-950 border border-white/10 rounded-[2.5rem] text-white font-black text-xl focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-800"
                                    placeholder="e.g. CRITICAL CORE UPDATE"
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Priority Level</label>
                                    <div className="grid grid-cols-2 gap-3 bg-slate-950 p-2 rounded-[2.5rem] border border-white/10">
                                        {['info', 'success', 'warning', 'urgent'].map(t => (
                                            <button 
                                                key={t}
                                                type="button"
                                                onClick={() => setForm(p => ({ ...p, type: t }))}
                                                className={cn(
                                                    "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    form.type === t ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" : "text-slate-600 hover:text-white"
                                                )}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Target Nodes</label>
                                    <select 
                                        className="w-full px-10 py-6 bg-slate-950 border border-white/10 rounded-[2.5rem] text-white font-black text-sm outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                        value={form.target_shop_id}
                                        onChange={e => setForm(p => ({ ...p, target_shop_id: e.target.value }))}
                                    >
                                        <option value="">All Active Nodes</option>
                                        {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Transmission Content</label>
                                <textarea
                                    className="w-full px-10 py-8 bg-slate-950 border border-white/10 rounded-[3rem] text-white font-bold text-lg outline-none focus:border-indigo-500 transition-all h-64 resize-none placeholder:text-slate-800 leading-relaxed shadow-inner"
                                    placeholder="Draft the global network broadcast here..."
                                    value={form.message}
                                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Expiry Horizon (Optional)</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                                    <input
                                        type="date"
                                        className="w-full pl-20 pr-10 py-6 bg-slate-950 border border-white/10 rounded-[2.5rem] text-white font-black text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                        value={form.expires_at}
                                        onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simulation & Review */}
                <div className="xl:col-span-5">
                    <div className="sticky top-12 space-y-8">
                        <div className="flex items-center justify-between px-6">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Fidelity Simulation</p>
                            <div className="flex items-center gap-2">
                                <Smartphone size={14} className="text-slate-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Standard Display Node</span>
                            </div>
                        </div>

                        <div className="relative group">
                            {/* Outer Frame Glow */}
                            <div className={cn("absolute -inset-1 rounded-[4rem] blur opacity-20 group-hover:opacity-40 transition duration-1000", config.glow)} />
                            
                            <div className="relative bg-slate-950 border border-white/10 rounded-[4rem] p-12 shadow-2xl overflow-hidden min-h-[540px] flex flex-col">
                                {/* Dashboard Background Mock - Optimized */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none p-12 space-y-10">
                                    <div className="flex justify-between items-center">
                                        <div className="w-32 h-6 bg-white rounded-full" />
                                        <div className="w-12 h-12 bg-white rounded-2xl" />
                                    </div>
                                    <div className="h-48 bg-white rounded-[3.5rem]" />
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="h-32 bg-white rounded-[3rem]" />
                                        <div className="h-32 bg-white rounded-[3rem]" />
                                    </div>
                                </div>

                                {/* Active Broadcast Preview - Enhanced Elevation */}
                                <div className="relative z-10 mt-12 animate-in zoom-in-95 duration-700">
                                    <div className={cn(
                                        "p-10 rounded-[3.5rem] border-2 shadow-2xl backdrop-blur-3xl transition-all duration-700",
                                        config.bg, config.border, 
                                        "shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)]",
                                        config.glow
                                    )}>
                                        <div className="flex items-center gap-6 mb-8">
                                            <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center border shadow-2xl", config.bg, config.border, config.color)}>
                                                <config.icon size={32} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.bg.replace('/10', ''))} style={{backgroundColor: 'currentColor'}} />
                                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.3em]", config.color)}>
                                                        {config.label}
                                                    </p>
                                                </div>
                                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase line-clamp-1">
                                                    {form.title || 'BROADCAST_ID_PENDING'}
                                                </h3>
                                            </div>
                                        </div>
                                        
                                        <div className="min-h-[120px] mb-8">
                                            <p className="text-slate-400 font-bold text-sm leading-relaxed line-clamp-5">
                                                {form.message || 'Draft the transmission content in the primary definition console to visualize the network impact...'}
                                            </p>
                                        </div>

                                        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                                                    <Terminal size={12} className="text-slate-600" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocol 4.0</span>
                                            </div>
                                            <div className={cn("flex items-center gap-3 px-5 py-2.5 rounded-full border bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all", config.border, config.color)}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                Live Visibility
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-12 text-center relative z-10">
                                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/5">
                                        <Smartphone size={14} className="text-slate-700" />
                                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Propulsion Simulation Node</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Matrix */}
                        <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[3rem] backdrop-blur-xl space-y-6">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                                <Sparkles size={16} className="text-indigo-500" />
                                Transmission Readiness
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-slate-500">Payload Integrity</span>
                                    <span className={cn(form.title && form.message ? "text-emerald-500" : "text-slate-700")}>
                                        {form.title && form.message ? 'Validated' : 'Pending Data'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-slate-500">Node Reach</span>
                                    <span className="text-white">{form.target_shop_id ? 'Segmented' : 'Global Network'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-slate-500">Priority Tier</span>
                                    <span className={config.color}>{config.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncementPage;
