import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ChevronLeft, 
    ShieldCheck, 
    Zap, 
    CreditCard, 
    TrendingUp, 
    Clock, 
    CheckCircle2,
    Sparkles,
    Loader2,
    Crown,
    Settings,
    LayoutGrid,
    Layers,
    DollarSign,
    Plus,
    X,
    Eye,
    EyeOff,
    Terminal,
    Cpu,
    ArrowRight,
    Globe,
    Activity,
    MessageSquare,
    Wallet,
    Users
} from 'lucide-react';
import api from '../../api/apiClient';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

const PlanEditGovernancePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    
    const [form, setForm] = useState({
        name: '',
        price: '',
        setup_fee: '',
        billing_cycle: 'Monthly',
        is_public: true,
        features: [],
        module_permissions: {}
    });

    const [newFeature, setNewFeature] = useState('');

    const availableModules = [
        { key: 'pos', label: 'Point of Sale (POS)', icon: Terminal },
        { key: 'inventory', label: 'Inventory Matrix', icon: Layers },
        { key: 'kot', label: 'Kitchen Display (KOT)', icon: Cpu },
        { key: 'delivery', label: 'Delivery Logistics', icon: Globe },
        { key: 'analytics', label: 'Neural Analytics', icon: Activity },
        { key: 'marketing', label: 'CRM & Marketing', icon: MessageSquare },
        { key: 'naya_book', label: 'Credit Ledger (Naya)', icon: Wallet },
        { key: 'hr', label: 'Human Resources', icon: Users },
    ];

    useEffect(() => {
        if (id !== 'new') fetchPlan();
        else setLoading(false);
    }, [id]);

    const fetchPlan = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/super-admin/plans/${id}`);
            if (data.success) {
                setForm({
                    ...data.data,
                    features: Array.isArray(data.data.features) ? data.data.features : JSON.parse(data.data.features || '[]'),
                    module_permissions: typeof data.data.module_permissions === 'string' 
                        ? JSON.parse(data.data.module_permissions || '{}') 
                        : data.data.module_permissions || {}
                });
            }
        } catch (err) {
            showToast('Failed to access plan registry', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            const endpoint = id === 'new' ? '/super-admin/plans' : `/super-admin/plans/${id}`;
            const method = id === 'new' ? 'post' : 'put';
            const { data } = await api[method](endpoint, form);
            if (data.success) {
                showToast(data.message, 'success');
                navigate('/super-admin/plans');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Update failed', 'error');
        } finally {
            setSaveLoading(false);
        }
    };

    const addFeature = () => {
        if (!newFeature.trim()) return;
        setForm(p => ({ 
            ...p, 
            features: [...(Array.isArray(p.features) ? p.features : []), newFeature.trim()] 
        }));
        setNewFeature('');
    };

    const removeFeature = (idx) => {
        setForm(p => ({ ...p, features: p.features.filter((_, i) => i !== idx) }));
    };

    const toggleModule = (key) => {
        setForm(p => ({
            ...p,
            module_permissions: {
                ...p.module_permissions,
                [key]: !p.module_permissions[key]
            }
        }));
    };

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Accessing Tier Registry...</p>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Cyber Header */}
            <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 p-12 rounded-[4rem] backdrop-blur-3xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -mr-40 -mt-40"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <Link 
                            to="/super-admin/plans"
                            className="p-5 bg-white/5 hover:bg-white/10 rounded-[2rem] text-slate-400 hover:text-white transition-all border border-white/5 group"
                        >
                            <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <Crown className="text-indigo-500" size={24} />
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Tier Architecture</p>
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tighter">
                                {id === 'new' ? 'New Protocol' : form.name} <span className="text-slate-700">/</span> Governance
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleSave}
                            disabled={saveLoading}
                            className="flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-900/40"
                        >
                            {saveLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                            {id === 'new' ? 'Initialize Tier' : 'Sync Tier Logic'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* Configuration Console */}
                <div className="xl:col-span-8 space-y-12">
                    {/* Primary Identity */}
                    <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] backdrop-blur-sm relative overflow-hidden">
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-4 mb-10">
                            <Settings className="text-indigo-500" size={24} />
                            Base Configuration
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Plan Identity (Label)</label>
                                <input
                                    type="text"
                                    className="w-full px-8 py-5 bg-slate-950 border border-white/5 rounded-[2rem] text-white font-black text-2xl focus:outline-none focus:border-indigo-500 transition-all"
                                    placeholder="e.g. ULTIMATE NEURAL"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Monthly Premium (LKR)</label>
                                <div className="relative group">
                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-emerald-500 font-black">Rs.</div>
                                    <input
                                        type="number"
                                        className="w-full pl-20 pr-8 py-5 bg-slate-950 border border-white/5 rounded-[2rem] text-white font-black text-xl focus:outline-none focus:border-indigo-500 transition-all"
                                        placeholder="0.00"
                                        value={form.price}
                                        onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">One-Time Setup Fee (LKR)</label>
                                <div className="relative group">
                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-500 font-black">Rs.</div>
                                    <input
                                        type="number"
                                        className="w-full pl-20 pr-8 py-5 bg-slate-950 border border-white/5 rounded-[2rem] text-white font-black text-xl focus:outline-none focus:border-indigo-500 transition-all"
                                        placeholder="0.00"
                                        value={form.setup_fee}
                                        onChange={e => setForm(p => ({ ...p, setup_fee: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Visibility Matrix</label>
                                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-2 rounded-[2rem] border border-white/5">
                                    <button 
                                        onClick={() => setForm(p => ({ ...p, is_public: true }))}
                                        className={cn(
                                            "py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                            form.is_public ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30" : "text-slate-500 hover:text-white"
                                        )}
                                    >
                                        <Eye size={16} /> Public
                                    </button>
                                    <button 
                                        onClick={() => setForm(p => ({ ...p, is_public: false }))}
                                        className={cn(
                                            "py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                            !form.is_public ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30" : "text-slate-500 hover:text-white"
                                        )}
                                    >
                                        <EyeOff size={16} /> Hidden
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Entitlements Matrix */}
                    <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] backdrop-blur-sm">
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-4 mb-10">
                            <LayoutGrid className="text-indigo-500" size={24} />
                            Feature Entitlements
                        </h2>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    className="flex-1 px-8 py-5 bg-slate-950 border border-white/5 rounded-[2rem] text-white font-bold focus:outline-none focus:border-indigo-500 transition-all"
                                    placeholder="Add specialized entitlement (e.g. 10GB Cloud Storage)"
                                    value={newFeature}
                                    onChange={e => setNewFeature(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && addFeature()}
                                />
                                <button 
                                    type="button"
                                    onClick={addFeature}
                                    className="relative group p-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl transition-all duration-500 shadow-2xl shadow-indigo-900/40 active:scale-90"
                                >
                                    <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-0 group-hover:opacity-40 transition-opacity rounded-3xl" />
                                    <Plus size={32} className="relative z-10 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>

                            {/* Neural Presets */}
                            <div className="flex flex-wrap gap-3 mt-6">
                                <p className="w-full text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1 ml-4 flex items-center gap-2">
                                    <Sparkles size={10} className="text-indigo-500" />
                                    Propulsion Presets
                                </p>
                                {[
                                    'Multi-Terminal Support', 'Mobile App Access', 'AI Sales Insights', 
                                    'Priority 24/7 Support', 'Unlimited Inventory', 'Custom Branding',
                                    'Advanced CRM', 'Cloud Auto-Backup', 'API Integration'
                                ].map(preset => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                            if (!form.features.includes(preset)) {
                                                setForm(p => ({ ...p, features: [...p.features, preset] }));
                                            }
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                            form.features.includes(preset)
                                                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400 opacity-50 cursor-not-allowed"
                                                : "bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10 hover:border-white/10"
                                        )}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                                {Array.isArray(form.features) && form.features.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-2xl group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-950/20 backdrop-blur-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] group-hover:scale-125 transition-transform" />
                                            <span className="text-[11px] font-black text-slate-300 group-hover:text-white transition-colors uppercase tracking-widest">{f.replace(/_/g, ' ')}</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => removeFeature(i)}
                                            className="p-2 text-slate-600 hover:text-rose-500 transition-all hover:rotate-90"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Module Permissions */}
                    <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] backdrop-blur-sm">
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-4 mb-10">
                            <ShieldCheck className="text-indigo-500" size={24} />
                            Module Access Gating
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {availableModules.map(mod => (
                                <button
                                    key={mod.key}
                                    onClick={() => toggleModule(mod.key)}
                                    className={cn(
                                        "flex items-center justify-between p-6 rounded-[2.5rem] border transition-all duration-500 group",
                                        form.module_permissions[mod.key]
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-xl shadow-emerald-900/10"
                                            : "bg-slate-950/40 border-white/5 text-slate-600 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
                                            form.module_permissions[mod.key] ? "bg-emerald-500/20 border-emerald-500/20" : "bg-white/5 border-white/5"
                                        )}>
                                            <mod.icon size={20} />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-widest">{mod.label}</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        form.module_permissions[mod.key] ? "bg-emerald-500 border-emerald-400" : "border-white/10"
                                    )}>
                                        {form.module_permissions[mod.key] && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="xl:col-span-4">
                    <div className="sticky top-12 space-y-8">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Neural Client Preview</p>
                        
                        <div className="relative overflow-hidden bg-slate-900 border-2 border-indigo-500/30 p-12 rounded-[4rem] shadow-2xl group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
                            
                            <div className="relative space-y-10">
                                <div className="text-center space-y-2">
                                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase">{form.name || 'Tier Prototype'}</h3>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Business Propulsion System</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="text-center py-8 bg-white/5 rounded-[3rem] border border-white/5">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Initial Commitment</p>
                                        <div className="flex items-end justify-center gap-1">
                                            <span className="text-[10px] font-black text-emerald-500 mb-1">Rs.</span>
                                            <span className="text-4xl font-black text-white tracking-tighter tabular-nums">
                                                {(parseFloat(form.price || 0) + parseFloat(form.setup_fee || 0)).toLocaleString()}
                                            </span>
                                            <span className="text-[8px] font-black text-slate-600 mb-1 uppercase tracking-tighter">(INC. SETUP)</span>
                                        </div>
                                    </div>

                                    <div className="text-center py-6 bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/10">
                                        <p className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest mb-1 text-center">Recurring Protocol</p>
                                        <div className="flex items-end justify-center gap-1">
                                            <span className="text-[9px] font-black text-indigo-500 mb-1">Rs.</span>
                                            <span className="text-2xl font-black text-white tracking-tighter tabular-nums">{parseFloat(form.price || 0).toLocaleString()}</span>
                                            <span className="text-[8px] font-black text-slate-600 mb-1 uppercase">/mo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {form.features.slice(0, 6).map((f, i) => (
                                        <div key={i} className="flex items-center gap-4 group/item">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover/item:scale-110 transition-transform">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-400 group-hover/item:text-white transition-colors">{f}</span>
                                        </div>
                                    ))}
                                    {form.features.length === 0 && (
                                        <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-slate-700 font-bold uppercase text-[10px] tracking-widest">
                                            Awaiting Entitlements
                                        </div>
                                    )}
                                </div>

                                <button className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 pointer-events-none group-hover:bg-indigo-500 transition-all">
                                    Initialize Provisioning
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[3rem] backdrop-blur-xl">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-4">
                                <Terminal size={16} className="text-indigo-500" />
                                Tier Metadata
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-500 uppercase">Core Modules</span>
                                    <span className="text-white">{Object.values(form.module_permissions).filter(v => v).length} Enabled</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-500 uppercase">Billing Cycle</span>
                                    <span className="text-white uppercase">{form.billing_cycle} Recurring</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-500 uppercase">Status</span>
                                    <span className={cn("uppercase", form.is_public ? "text-emerald-500" : "text-rose-500")}>
                                        {form.is_public ? 'Active Network' : 'Restricted Access'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanEditGovernancePage;
