import React, { useState } from 'react';
import {
    ArrowLeft, Store, User, Mail, Lock, CheckCircle2,
    Loader2, ShieldAlert, Globe, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, ClipboardList, Copy, Trash2, List } from 'lucide-react';
import { superAdminApi } from '../../api/api';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

// Convert any string into a valid slug
const toSlug = (str) =>
    str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const SLUG_REGEX = /^[a-z0-9-]{3,50}$/;

const Field = ({ label, error, children, hint }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-400 ml-1">{label}</label>
        {children}
        {error && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400 ml-1">
                <AlertCircle size={12} /> {error}
            </p>
        )}
        {!error && hint && <p className="text-[11px] text-slate-500 ml-1">{hint}</p>}
    </div>
);

const Input = ({ icon: Icon, error, className, ...props }) => (
    <div className="relative">
        {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />}
        <input
            className={cn(
                'w-full py-4 bg-slate-950 border rounded-2xl text-white placeholder:text-slate-700 focus:outline-none transition-all',
                Icon ? 'pl-14 pr-4' : 'px-4',
                error ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500/50',
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
    });

    const [errors, setErrors] = useState({});

    // ── Field change handler ─────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'identifier') {
            // Allow only valid chars while typing; auto-lowercase
            const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            setForm(p => ({ ...p, identifier: cleaned }));
            setErrors(p => ({ ...p, identifier: '' }));
            return;
        }

        if (name === 'name') {
            // Auto-fill identifier from name if identifier is still empty or was auto-generated
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

    // ── Frontend validation ──────────────────────────────────────────────────
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

    // ── Submit ───────────────────────────────────────────────────────────────
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

            // Surface backend errors to specific fields
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
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 relative">
            {/* Background cinematic glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-600/5 blur-[120px] rounded-full -z-10" />

            {/* Header with improved hierarchy */}
            <div className="flex items-center gap-6">
                <Link to="/super-admin/shops" className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[2rem] text-slate-400 hover:text-white transition-all shadow-xl backdrop-blur-md">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">System Provisioning</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Onboard New Shop</h1>
                    <p className="text-slate-400 font-medium mt-1">Initialize a new secure restaurant instance and global admin account.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Shop Details - Glassmorphism Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/20 transition-all duration-700" />
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-inner">
                            <Store size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Shop Identity</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Restaurant Meta Data</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Field label="Restaurant Name" error={errors.name}>
                            <Input
                                icon={Store}
                                type="text"
                                name="name"
                                placeholder="e.g. Blue Lagoon Restaurant"
                                value={form.name}
                                onChange={handleChange}
                                error={errors.name}
                                autoComplete="off"
                                className="bg-slate-950/50 border-white/[0.03] focus:bg-slate-950 transition-all"
                            />
                        </Field>

                        <Field
                            label="URL Identifier (Public Slug)"
                            error={errors.identifier}
                        >
                            <div className="relative group/slug">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-xs flex items-center gap-1.5 pointer-events-none z-10">
                                    <Globe size={14} />
                                    <span>resto.link/</span>
                                </div>
                                <input
                                    type="text"
                                    name="identifier"
                                    placeholder="your-slug"
                                    value={form.identifier}
                                    onChange={handleChange}
                                    className={cn(
                                        'w-full py-4 pl-28 pr-4 bg-slate-950/50 border rounded-2xl text-white font-mono text-sm placeholder:text-slate-800 focus:outline-none transition-all group-hover/slug:border-white/10',
                                        errors.identifier ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500/50'
                                    )}
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mt-2 ml-1">
                                {form.identifier ? (
                                    <>Public Menu: <span className="text-indigo-400 lowercase">/menu/{form.identifier}</span></>
                                ) : (
                                    "System will generate a unique slug automatically"
                                )}
                            </p>
                        </Field>
                    </div>
                </div>

                {/* Owner Account - Glassmorphism Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-purple-600/20 transition-all duration-700" />
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/20 text-purple-400 shadow-inner">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Security & Ownership</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Admin Credentials</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Field label="Primary Administrator" error={errors.admin_name}>
                            <Input
                                icon={User}
                                type="text"
                                name="admin_name"
                                placeholder="e.g. Kamal Perera"
                                value={form.admin_name}
                                onChange={handleChange}
                                error={errors.admin_name}
                                className="bg-slate-950/50 border-white/[0.03]"
                            />
                        </Field>

                        <Field label="Email Address" error={errors.admin_email}>
                            <Input
                                icon={Mail}
                                type="email"
                                name="admin_email"
                                placeholder="owner@restaurant.com"
                                value={form.admin_email}
                                onChange={handleChange}
                                error={errors.admin_email}
                                className="bg-slate-950/50 border-white/[0.03]"
                            />
                        </Field>

                        <Field label="Initial Access Key" error={errors.admin_password} hint="Securely generated or custom">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="admin_password"
                                    placeholder="••••••••"
                                    value={form.admin_password}
                                    onChange={handleChange}
                                    className={cn(
                                        'w-full pl-12 pr-12 py-4 bg-slate-950/50 border rounded-2xl text-white placeholder:text-slate-800 focus:outline-none transition-all',
                                        errors.admin_password ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500/50'
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.admin_password && (
                                <p className="flex items-center gap-1.5 text-xs text-rose-400 ml-1 mt-1">
                                    <AlertCircle size={12} /> {errors.admin_password}
                                </p>
                            )}
                        </Field>
                    </div>
                </div>

                {/* Menu Setup - Elevated Selector */}
                <div className="md:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-inner">
                                <Menu size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Tenant Initialization</h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Inventory & Menu Strategy</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { id: 'empty', label: 'Clean Slate', icon: Trash2, desc: 'Fresh Database' },
                            { id: 'template', label: 'Sri Lankan Pack', icon: List, desc: 'Pre-filled Items' },
                            { id: 'copy', label: 'Clone Shop', icon: Copy, desc: 'Mirror Existing' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setForm(p => ({ ...p, menu_setup: option.id }))}
                                className={cn(
                                    "group flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border transition-all text-center relative overflow-hidden",
                                    form.menu_setup === option.id 
                                        ? "bg-indigo-600/20 border-indigo-500/40 text-white shadow-2xl shadow-indigo-900/20" 
                                        : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10 hover:bg-slate-950/60"
                                )}
                            >
                                {form.menu_setup === option.id && (
                                    <div className="absolute top-2 right-2">
                                        <CheckCircle2 size={16} className="text-indigo-400" />
                                    </div>
                                )}
                                <div className={cn(
                                    "w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500",
                                    form.menu_setup === option.id ? "bg-indigo-500 text-white scale-110 rotate-6" : "bg-white/5 text-slate-600 group-hover:scale-110"
                                )}>
                                    <option.icon size={28} />
                                </div>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest">{option.label}</p>
                                    <p className="text-[10px] opacity-60 mt-1 font-bold uppercase tracking-tighter">{option.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {form.menu_setup === 'copy' && (
                        <div className="pt-8 border-t border-white/[0.03] animate-in fade-in slide-in-from-top-4 duration-500">
                            <Field label="Source Shop Entity" error={errors.source_shop_id}>
                                <div className="relative group/select">
                                    <Copy className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" size={20} />
                                    <select
                                        name="source_shop_id"
                                        value={form.source_shop_id}
                                        onChange={handleChange}
                                        className={cn(
                                            'w-full pl-14 pr-10 py-5 bg-slate-950/80 border rounded-3xl text-white font-bold appearance-none focus:outline-none transition-all group-hover/select:border-white/10',
                                            errors.source_shop_id ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500/50'
                                        )}
                                    >
                                        <option value="">Select a restaurant instance to copy data from...</option>
                                        {shops.map(shop => (
                                            <option key={shop.id} value={shop.id}>{shop.name} — ({shop.identifier})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ArrowLeft className="-rotate-90 text-slate-600" size={16} />
                                    </div>
                                </div>
                            </Field>
                        </div>
                    )}
                </div>

                {/* Submit - Full Width Cinematic Button */}
                <div className="md:col-span-2 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white rounded-[2.5rem] font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-indigo-950/50 transition-all overflow-hidden flex items-center justify-center gap-4"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Initializing Tenant...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={24} />
                                Create Restaurant instance
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-6 opacity-40">Security policy: All instances are isolated via unique tenant IDs.</p>
                </div>
            </form>
        </div>
    );
};

export default CreateShopPage;
