import React, { useState } from 'react';
import {
    ArrowLeft, Store, User, Mail, Lock, CheckCircle2,
    Loader2, ShieldAlert, Globe, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, ClipboardList, Copy, Trash2, List } from 'lucide-react';
import apiClient from '../../api/apiClient';
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

const Input = ({ icon: Icon, error, ...props }) => (
    <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />}
        <input
            className={cn(
                'w-full py-4 bg-slate-950 border rounded-2xl text-white placeholder:text-slate-600 focus:outline-none transition-all',
                Icon ? 'pl-12 pr-4' : 'px-4',
                error ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500/50'
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
                const { data } = await apiClient.get('/super-admin/shops');
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
            const { data } = await apiClient.post('/super-admin/shops', form);
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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/super-admin/shops" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                    <ArrowLeft size={22} />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Onboard New Shop</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Initialize a new restaurant instance and admin account.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Shop Details */}
                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-5">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Store size={18} className="text-indigo-400" />
                        </div>
                        <h2 className="text-base font-black text-white">Shop Information</h2>
                    </div>

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
                        />
                    </Field>

                    <Field
                        label="URL Identifier (Slug)"
                        error={errors.identifier}
                        hint={`Public menu URL: /menu/${form.identifier || 'your-slug'}`}
                    >
                        <Input
                            icon={Globe}
                            type="text"
                            name="identifier"
                            placeholder="e.g. blue-lagoon"
                            value={form.identifier}
                            onChange={handleChange}
                            error={errors.identifier}
                            className="font-mono"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </Field>
                </div>

                {/* Owner Account */}
                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-5">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <ShieldAlert size={18} className="text-indigo-400" />
                        </div>
                        <h2 className="text-base font-black text-white">Owner Account</h2>
                    </div>

                    <Field label="Admin Name" error={errors.admin_name}>
                        <Input
                            icon={User}
                            type="text"
                            name="admin_name"
                            placeholder="e.g. Kamal Perera"
                            value={form.admin_name}
                            onChange={handleChange}
                            error={errors.admin_name}
                        />
                    </Field>

                    <Field label="Admin Email" error={errors.admin_email}>
                        <Input
                            icon={Mail}
                            type="email"
                            name="admin_email"
                            placeholder="owner@restaurant.com"
                            value={form.admin_email}
                            onChange={handleChange}
                            error={errors.admin_email}
                        />
                    </Field>

                    <Field label="Initial Password" error={errors.admin_password} hint="Min. 6 characters">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="admin_password"
                                placeholder="••••••••"
                                value={form.admin_password}
                                onChange={handleChange}
                                className={cn(
                                    'w-full pl-12 pr-12 py-4 bg-slate-950 border rounded-2xl text-white placeholder:text-slate-600 focus:outline-none transition-all',
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
                            <p className="flex items-center gap-1.5 text-xs text-rose-400 ml-1">
                                <AlertCircle size={12} /> {errors.admin_password}
                            </p>
                        )}
                    </Field>
                </div>

                {/* Menu Setup */}
                <div className="md:col-span-2 bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Menu size={18} className="text-indigo-400" />
                        </div>
                        <h2 className="text-base font-black text-white">Menu Setup</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { id: 'empty', label: 'Empty Menu', icon: Trash2, desc: 'Start from scratch' },
                            { id: 'template', label: 'Default Template', icon: List, desc: 'Sri Lankan menu preset' },
                            { id: 'copy', label: 'Copy Existing', icon: Copy, desc: 'Clone from another shop' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setForm(p => ({ ...p, menu_setup: option.id }))}
                                className={cn(
                                    "flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all text-center",
                                    form.menu_setup === option.id 
                                        ? "bg-indigo-600/10 border-indigo-500/50 text-white" 
                                        : "bg-slate-950 border-white/5 text-slate-400 hover:border-white/10"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                                    form.menu_setup === option.id ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-500"
                                )}>
                                    <option.icon size={22} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{option.label}</p>
                                    <p className="text-[10px] opacity-60 mt-0.5 uppercase tracking-wider">{option.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {form.menu_setup === 'copy' && (
                        <div className="pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Field label="Source Shop" error={errors.source_shop_id}>
                                <div className="relative">
                                    <Copy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                                    <select
                                        name="source_shop_id"
                                        value={form.source_shop_id}
                                        onChange={handleChange}
                                        className={cn(
                                            'w-full pl-12 pr-4 py-4 bg-slate-950 border rounded-2xl text-white appearance-none focus:outline-none transition-all',
                                            errors.source_shop_id ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500/50'
                                        )}
                                    >
                                        <option value="">Select shop to copy from...</option>
                                        {shops.map(shop => (
                                            <option key={shop.id} value={shop.id}>{shop.name} ({shop.identifier})</option>
                                        ))}
                                    </select>
                                </div>
                            </Field>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="md:col-span-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white rounded-3xl font-black text-base shadow-2xl shadow-indigo-900/50 transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={22} />
                                Creating shop...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={22} />
                                Complete Provisioning
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateShopPage;
