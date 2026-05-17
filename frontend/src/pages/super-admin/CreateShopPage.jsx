import React, { useState } from 'react';
import {
    ArrowLeft, Store, User, Mail, Lock, CheckCircle2,
    Loader2, ShieldAlert, Globe, AlertCircle, Eye, EyeOff,
    Zap, Sparkles, Database, Layers, Copy, List, Trash2,
    LayoutGrid, ChevronRight, Fingerprint, ShieldCheck, Smartphone
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { superAdminApi } from '../../api/api';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

// Convert any string into a valid slug
const toSlug = (str) =>
    str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const SLUG_REGEX = /^[a-z0-9-]{3,50}$/;

const Field = ({ label, error, children, hint }) => (
    <div className="space-y-2.5">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{label}</label>
        {children}
        {error && (
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 ml-1 animate-in slide-in-from-top-1">
                <AlertCircle size={14} /> {error}
            </div>
        )}
        {!error && hint && <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight ml-1 opacity-70">{hint}</p>}
    </div>
);

const Input = ({ icon: Icon, error, className, ...props }) => (
    <div className="relative group/input">
        {Icon && <Icon className={cn(
            "absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300",
            error ? "text-rose-500" : "text-slate-500 group-focus-within/input:text-indigo-400"
        )} size={18} />}
        <input
            className={cn(
                'w-full py-5 bg-slate-950/40 border rounded-2xl text-white font-bold placeholder:text-slate-800 focus:outline-none transition-all backdrop-blur-sm',
                Icon ? 'pl-14 pr-4' : 'px-6',
                error ? 'border-rose-500/50 focus:border-rose-500 bg-rose-500/5' : 'border-white/5 focus:border-indigo-500/50 focus:bg-slate-950/80',
                className
            )}
            {...props}
        />
    </div>
);

const CreateShopPage = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);

    React.useEffect(() => {
        const fetchShops = async () => {
            try {
                const { data } = await superAdminApi.getShops();
                if (data.success) {
                    setShops(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch shops', err);
            }
        };
        fetchShops();
    }, []);

    const [form, setForm] = useState({
        name: '',
        identifier: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        menu_setup: 'empty', // empty, template, copy
        source_shop_id: '',
        shop_email: '',
        shop_phone: '',
        shop_address: '',
    });

    const [errors, setErrors] = useState({});

    // ── Field change handler ─────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'identifier') {
            const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            setForm(p => ({ ...p, identifier: cleaned }));
            setErrors(p => ({ ...p, identifier: '' }));
            return;
        }

        if (name === 'name') {
            setForm(p => {
                const identifierWasAuto = p.identifier === toSlug(p.name);
                return {
                    ...p,
                    name: value,
                    identifier: identifierWasAuto ? toSlug(value) : p.identifier,
                };
            });
            setErrors(p => ({ ...p, name: '' }));
            return;
        }

        setForm(p => ({ ...p, [name]: value }));
        setErrors(p => ({ ...p, [name]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Restaurant name is required.';
        if (!form.identifier) {
            errs.identifier = 'URL identifier is required.';
        } else if (!SLUG_REGEX.test(form.identifier)) {
            errs.identifier = 'Use lowercase letters, numbers and hyphens only. Length 3–50.';
        }
        if (!form.admin_name.trim()) errs.admin_name = 'Admin name is required.';
        if (!form.admin_email.trim()) {
            errs.admin_email = 'Admin email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email)) {
            errs.admin_email = 'Enter a valid email address.';
        }
        if (!form.admin_password) {
            errs.admin_password = 'Password is required.';
        } else if (form.admin_password.length < 6) {
            errs.admin_password = 'Password must be at least 6 characters.';
        }
        if (form.menu_setup === 'copy' && !form.source_shop_id) {
            errs.source_shop_id = 'Please select a source shop to copy from.';
        }
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setLoading(true);
        try {
            const { data } = await superAdminApi.createShop(form);
            if (data.success) {
                showToast(`Shop "${form.name}" provisioned successfully!`, 'success');
                navigate('/super-admin/shops');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create shop. Please try again.';
            showToast(msg, 'error');

            if (msg.toLowerCase().includes('identifier') || msg.toLowerCase().includes('slug')) {
                setErrors(p => ({ ...p, identifier: msg }));
            } else if (msg.toLowerCase().includes('email')) {
                setErrors(p => ({ ...p, admin_email: msg }));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 relative">
            {/* Background cinematic glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-600/5 blur-[120px] rounded-full -z-10" />

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <Link to="/super-admin/shops" className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl backdrop-blur-md group">
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="text-indigo-500" size={14} />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Cloud Provisioning Engine</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter">Onboard Instance</h1>
                        <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-tight opacity-70">Initialize dedicated tenant & root administrator</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-4 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-3xl backdrop-blur-sm">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Zap size={24} className="animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Readiness</p>
                        <p className="text-sm font-black text-emerald-400 uppercase tracking-tighter">Nodes Available</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Form Body */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Step 1: Shop Identity */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-10 relative overflow-hidden group/card">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover/card:bg-indigo-600/10 transition-all duration-1000" />
                        
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-2xl">
                                <Store size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Identity Configuration</h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Tenant Naming & Routing</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="md:col-span-2">
                                <Field label="Restaurant Branding Name" error={errors.name}>
                                    <Input
                                        icon={Store}
                                        type="text"
                                        name="name"
                                        placeholder="e.g. Blue Lagoon Specialty"
                                        value={form.name}
                                        onChange={handleChange}
                                        error={errors.name}
                                        autoComplete="off"
                                    />
                                </Field>
                            </div>

                            <div className="md:col-span-2">
                                <Field
                                    label="Global URL Identifier"
                                    error={errors.identifier}
                                    hint="This identifier will be used for the public menu URL"
                                >
                                    <div className={cn(
                                        "flex items-center w-full bg-slate-950/50 border rounded-2xl transition-all group-hover/slug:border-white/10 focus-within:bg-slate-950 overflow-hidden",
                                        errors.identifier ? 'border-rose-500/50 focus-within:border-rose-500' : 'border-white/5 focus-within:border-indigo-500/50'
                                    )}>
                                        <div className="pl-6 pr-3 py-5 text-slate-600 font-mono text-sm flex items-center gap-2 bg-white/[0.02] border-r border-white/5 transition-colors focus-within:text-indigo-400">
                                            <Globe size={18} />
                                            <span className="font-bold tracking-tight">restoledger.app/</span>
                                        </div>
                                        <input
                                            type="text"
                                            name="identifier"
                                            placeholder="instance-slug"
                                            value={form.identifier}
                                            onChange={handleChange}
                                            className="flex-1 py-5 px-4 bg-transparent text-white font-black text-lg placeholder:text-slate-800 focus:outline-none w-full"
                                            autoComplete="off"
                                            spellCheck={false}
                                        />
                                    </div>
                                </Field>
                            </div>

                            <div className="md:col-span-1">
                                <Field label="Support Email" error={errors.shop_email}>
                                    <Input
                                        icon={Mail}
                                        type="email"
                                        name="shop_email"
                                        placeholder="support@restaurant.com"
                                        value={form.shop_email}
                                        onChange={handleChange}
                                    />
                                </Field>
                            </div>

                            <div className="md:col-span-1">
                                <Field label="Contact Number" error={errors.shop_phone}>
                                    <Input
                                        icon={Smartphone}
                                        type="text"
                                        name="shop_phone"
                                        placeholder="+94 7X XXX XXXX"
                                        value={form.shop_phone}
                                        onChange={handleChange}
                                    />
                                </Field>
                            </div>

                            <div className="md:col-span-2">
                                <Field label="Physical Address" error={errors.shop_address}>
                                    <Input
                                        icon={Globe}
                                        type="text"
                                        name="shop_address"
                                        placeholder="Street Address, City"
                                        value={form.shop_address}
                                        onChange={handleChange}
                                    />
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Ownership */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-10 relative overflow-hidden group/card">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover/card:bg-purple-600/10 transition-all duration-1000" />
                        
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 shadow-2xl">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Root Authority</h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Super Admin Account Provisioning</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <Field label="Administrative Name" error={errors.admin_name}>
                                <Input
                                    icon={User}
                                    type="text"
                                    name="admin_name"
                                    placeholder="Full Legal Name"
                                    value={form.admin_name}
                                    onChange={handleChange}
                                    error={errors.admin_name}
                                />
                            </Field>

                            <Field label="Administrative Email" error={errors.admin_email}>
                                <Input
                                    icon={Mail}
                                    type="email"
                                    name="admin_email"
                                    placeholder="owner@domain.com"
                                    value={form.admin_email}
                                    onChange={handleChange}
                                    error={errors.admin_email}
                                />
                            </Field>

                            <div className="md:col-span-2">
                                <Field label="Master Access Key" error={errors.admin_password} hint="Password for the primary root administrator">
                                    <div className="relative group/pass">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/pass:text-indigo-400 transition-colors pointer-events-none" size={20} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="admin_password"
                                            placeholder="••••••••••••"
                                            value={form.admin_password}
                                            onChange={handleChange}
                                            className={cn(
                                                'w-full pl-16 pr-16 py-5 bg-slate-950/50 border rounded-2xl text-white font-black text-lg placeholder:text-slate-800 focus:outline-none transition-all group-focus-within/pass:bg-slate-950',
                                                errors.admin_password ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500/50'
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                        </button>
                                    </div>
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Initialization Strategy */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 space-y-12">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-2xl">
                                    <Database size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Database Strategy</h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Tenant Schema & Content Initialization</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { id: 'empty', label: 'Raw State', icon: Trash2, desc: 'Empty DB Architecture', color: 'blue' },
                                { id: 'template', label: 'Sri Lankan Pack', icon: List, desc: 'Regional Meta Data', color: 'indigo' },
                                { id: 'copy', label: 'Mirror Clone', icon: Copy, desc: 'Duplicate Existing Node', color: 'purple' },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, menu_setup: option.id }))}
                                    className={cn(
                                        "group flex flex-col items-center gap-6 p-10 rounded-[3rem] border transition-all text-center relative overflow-hidden",
                                        form.menu_setup === option.id 
                                            ? "bg-indigo-600/20 border-indigo-500/40 text-white shadow-[0_0_50px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/50" 
                                            : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10 hover:bg-slate-950/60"
                                    )}
                                >
                                    {form.menu_setup === option.id && (
                                        <div className="absolute top-4 right-4 animate-in zoom-in-50">
                                            <CheckCircle2 size={20} className="text-indigo-400" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-700",
                                        form.menu_setup === option.id ? "bg-indigo-500 text-white scale-110 shadow-2xl shadow-indigo-500/40" : "bg-white/5 text-slate-600 group-hover:scale-110 group-hover:rotate-6"
                                    )}>
                                        <option.icon size={32} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">{option.label}</p>
                                        <p className="text-[9px] opacity-50 font-bold uppercase tracking-widest">{option.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {form.menu_setup === 'copy' && (
                            <div className="pt-10 border-t border-white/[0.03] animate-in fade-in slide-in-from-top-6 duration-700">
                                <Field label="Reference Entity (Source Node)" error={errors.source_shop_id}>
                                    <div className="relative group/select">
                                        <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" size={24} />
                                        <select
                                            name="source_shop_id"
                                            value={form.source_shop_id}
                                            onChange={handleChange}
                                            className={cn(
                                                'w-full pl-16 pr-12 py-6 bg-slate-950/80 border rounded-[2rem] text-white font-black text-lg appearance-none focus:outline-none transition-all group-hover/select:border-white/10 group-focus-within/select:border-indigo-500',
                                                errors.source_shop_id ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5'
                                            )}
                                        >
                                            <option value="">Select a restaurant node to clone...</option>
                                            {shops.map(shop => (
                                                <option key={shop.id} value={shop.id}>{shop.name} — [{shop.identifier}]</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                            <ChevronRight className="rotate-90" size={24} />
                                        </div>
                                    </div>
                                </Field>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Context */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl -mr-16 -mt-16" />
                        
                        <h3 className="text-xl font-black text-white mb-8 tracking-tight flex items-center gap-3">
                            <Fingerprint size={24} className="text-indigo-400" />
                            Security Protocol
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="flex gap-4 p-5 bg-white/5 rounded-3xl border border-white/5">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex-shrink-0 flex items-center justify-center text-indigo-400">
                                    <ShieldAlert size={20} />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">All instances are hardware-isolated at the database level using unique Tenant UUIDs.</p>
                            </div>
                            
                            <div className="flex gap-4 p-5 bg-white/5 rounded-3xl border border-white/5">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex-shrink-0 flex items-center justify-center text-emerald-400">
                                    <CheckCircle2 size={20} />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">Real-time encryption is applied to all administrator passwords upon deployment.</p>
                            </div>

                            <div className="pt-6">
                                <div className="p-8 bg-indigo-600/10 rounded-[2.5rem] border border-indigo-500/20 text-center">
                                    <LayoutGrid size={32} className="text-indigo-500 mx-auto mb-4" />
                                    <p className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.2em]">Ready for Deployment</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-10 backdrop-blur-xl">
                        <h3 className="text-xl font-black text-white mb-6 tracking-tight">Onboarding Flow</h3>
                        <div className="space-y-6">
                            {[
                                { step: '01', label: 'Domain Mapping', active: true },
                                { step: '02', label: 'Auth Provisioning', active: form.admin_email !== '' },
                                { step: '03', label: 'Node Distribution', active: false },
                            ].map((s) => (
                                <div key={s.step} className="flex items-center gap-4 group">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-500",
                                        s.active ? "bg-indigo-600 border-indigo-400 text-white" : "bg-white/5 border-white/5 text-slate-600"
                                    )}>
                                        {s.step}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-black uppercase tracking-widest",
                                        s.active ? "text-white" : "text-slate-600"
                                    )}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Action Button */}
                <div className="lg:col-span-12 pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full py-7 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white rounded-[3rem] font-black text-xl uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all overflow-hidden flex items-center justify-center gap-6 active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={28} />
                                <span className="animate-pulse">Deploying Instance Cluster...</span>
                            </>
                        ) : (
                            <>
                                <Zap size={28} className="text-indigo-200" />
                                Launch Restaurant Instance
                                <ArrowLeft className="rotate-180 text-indigo-300 group-hover:translate-x-2 transition-transform" size={24} />
                            </>
                        )}
                    </button>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 opacity-40">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PCI DSS Compliant</p>
                        </div>
                        <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-700" />
                        <div className="flex items-center gap-2">
                            <Smartphone size={14} className="text-blue-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Ready Provisioning</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateShopPage;
