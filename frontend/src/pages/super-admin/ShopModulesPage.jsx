import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ChevronLeft, 
    ShieldCheck, 
    Zap, 
    Truck, 
    Megaphone, 
    ShoppingCart, 
    Wallet, 
    BookOpen, 
    Users, 
    Package, 
    Grid3X3, 
    Calendar, 
    Clock, 
    LineChart, 
    BarChart3, 
    UserCog, 
    Settings,
    ShieldAlert,
    Sparkles,
    Activity,
    Database,
    Cpu,
    Loader2
} from 'lucide-react';
import api from '../../api/apiClient';
import { useToast } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

const ShopModulesPage = () => {
    const { identifier } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingKey, setUpdatingKey] = useState(null);

    const MODULE_CATEGORIES = [
        {
            title: 'Core Operations',
            desc: 'Essential logistics & transactional flow governance',
            modules: [
                { key: 'delivery_hub', label: 'Delivery Hub', icon: Truck, color: 'blue', desc: 'Real-time logistics & takeaway flow protocols' },
                { key: 'quick_retail', label: 'Quick Retail', icon: ShoppingCart, color: 'amber', desc: 'Accelerated checkout for non-F&B inventories' },
                { key: 'tables', label: 'Table Matrix', icon: Grid3X3, color: 'slate', desc: 'Dynamic floor mapping & table state tracking' },
                { key: 'items', label: 'Inventory Hub', icon: Package, color: 'emerald', desc: 'Centralized asset & SKU lifecycle management' },
            ]
        },
        {
            title: 'Financial Stream',
            desc: 'Monetary ledger & operational cost oversight',
            modules: [
                { key: 'expenses', label: 'Expense Matrix', icon: Wallet, color: 'rose', desc: 'Outbound capital tracking & cost center audits' },
                { key: 'naya_book', label: 'Naya Book', icon: BookOpen, color: 'indigo', desc: 'Decentralized credit ledger & debt governance' },
                { key: 'purchases', label: 'Stock Inbound', icon: Database, color: 'blue', desc: 'Procurement protocols & supplier fulfillment' },
            ]
        },
        {
            title: 'Growth & Intelligence',
            desc: 'AI insights & customer acquisition frameworks',
            modules: [
                { key: 'bi', label: 'Neural Analytics', icon: LineChart, color: 'violet', desc: 'Predictive BI dashboards & data visualization' },
                { key: 'marketing', label: 'Marketing Suite', icon: Megaphone, color: 'purple', desc: 'Multi-channel campaigns & SMS gateway access' },
                { key: 'customers', label: 'Customer CRM', icon: Users, color: 'cyan', desc: 'Identity management & loyalty neural networks' },
            ]
        },
        {
            title: 'System Protocols',
            desc: 'Administrative governance & security parameters',
            modules: [
                { key: 'shifts', label: 'Shift System', icon: Clock, color: 'blue', desc: 'Staff temporal tracking & clock-in/out logic' },
                { key: 'reservations', label: 'Slot Registry', icon: Calendar, color: 'orange', desc: 'Future capacity planning & booking engine' },
                { key: 'audit_logs', label: 'Security Audits', icon: ShieldCheck, color: 'slate', desc: 'System-wide event logging & integrity monitoring' },
                { key: 'users', label: 'User Governance', icon: UserCog, color: 'slate', desc: 'Role-based access & identity provisioning' },
                { key: 'settings', label: 'Core Config', icon: Settings, color: 'slate', desc: 'High-level system parameter configuration' },
            ]
        }
    ];

    useEffect(() => {
        fetchShop();
    }, [identifier]);

    const fetchShop = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/super-admin/shops/${identifier}`);
            if (data.success) {
                const shopData = data.data;
                shopData.module_permissions = typeof shopData.module_permissions === 'string' 
                    ? JSON.parse(shopData.module_permissions) 
                    : (shopData.module_permissions || {});
                setShop(shopData);
            }
        } catch (err) {
            console.error(err);
            showToast('Neural link failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPreset = async (planType) => {
        const presets = {
            'STARTER': ['delivery_hub', 'items', 'reports', 'settings', 'users'],
            'STANDARD': ['delivery_hub', 'items', 'reports', 'settings', 'users', 'expenses', 'customers', 'tables', 'shifts', 'held_bills', 'reservations'],
            'ULTIMATE': ['delivery_hub', 'marketing', 'quick_retail', 'expenses', 'naya_book', 'customers', 'items', 'tables', 'reservations', 'shifts', 'bi', 'reports', 'users', 'audit_logs', 'settings', 'purchases']
        };

        const targetModules = presets[planType] || [];
        const newPerms = {};
        
        // Disable everything first
        MODULE_CATEGORIES.forEach(cat => {
            cat.modules.forEach(mod => {
                newPerms[mod.key] = targetModules.includes(mod.key);
            });
        });

        try {
            setLoading(true);
            await api.patch(`/super-admin/shops/${shop.id}/feature-permission`, { 
                feature: 'all_modules', // Special key for batch update
                permissions: newPerms,
                isBatch: true 
            });
            
            setShop(prev => ({ ...prev, module_permissions: newPerms }));
            showToast(`${planType} preset synchronized`, 'success');
        } catch (err) {
            showToast('Batch sync failure', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (modKey, currentVal) => {
        try {
            setUpdatingKey(modKey);
            const newVal = !currentVal;
            await api.patch(`/super-admin/shops/${shop.id}/feature-permission`, { 
                feature: modKey, 
                enabled: newVal,
                isModule: true
            });
            setShop(prev => ({
                ...prev,
                module_permissions: { ...prev.module_permissions, [modKey]: newVal }
            }));
            showToast(`${modKey.replace('_', ' ')} synchronized`, 'success');
        } catch (err) {
            showToast('Sync failure', 'error');
        } finally {
            setUpdatingKey(null);
        }
    };

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Accessing Module Matrix...</p>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Cyber Header */}
            <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 p-12 rounded-[4rem] backdrop-blur-3xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <Link 
                            to={`/super-admin/shops/${identifier}`}
                            className="p-5 bg-white/5 hover:bg-white/10 rounded-[2rem] text-slate-400 hover:text-white transition-all border border-white/5 group"
                        >
                            <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <Cpu className="text-indigo-500 animate-spin-slow" size={24} />
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Governance Console</p>
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tighter">
                                {shop?.name} <span className="text-slate-700">/</span> Modules
                            </h1>
                        </div>
                    </div>
                    <div className="px-8 py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] backdrop-blur-xl">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">Active Protocols</p>
                        <p className="text-2xl font-black text-white tabular-nums">
                            {Object.values(shop?.module_permissions || {}).filter(v => v !== false).length} <span className="text-slate-500 text-sm">/ 15</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Provisioning Presets */}
            <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[4rem] backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-4">
                            <Zap className="text-indigo-500" size={24} />
                            Provisioning Presets
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">One-click neural configuration based on pricing plan</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {[
                            { id: 'STARTER', label: 'Starter', color: 'emerald', active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                            { id: 'STANDARD', label: 'Standard', color: 'indigo', active: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                            { id: 'ULTIMATE', label: 'Ultimate', color: 'purple', active: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
                        ].map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => handleApplyPreset(preset.id)}
                                className={cn(
                                    "px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all border active:scale-95 hover:bg-white/5",
                                    preset.active
                                )}
                            >
                                Apply {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {MODULE_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="space-y-8 p-10 bg-white/[0.02] border border-white/5 rounded-[4rem] backdrop-blur-sm relative overflow-hidden group/cat">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover/cat:bg-indigo-500/5 transition-colors duration-700"></div>
                        <div className="relative">
                            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                                <Sparkles className="text-indigo-500" size={24} />
                                {cat.title}
                            </h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{cat.desc}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 relative">
                            {cat.modules.map((mod) => {
                                const isEnabled = shop.module_permissions?.[mod.key] !== false;
                                const isUpdating = updatingKey === mod.key;

                                return (
                                    <div 
                                        key={mod.key} 
                                        className={cn(
                                            "p-8 rounded-[3rem] border transition-all duration-500 flex items-center justify-between group/mod relative overflow-hidden",
                                            isEnabled 
                                                ? "bg-slate-900/60 border-indigo-500/20 shadow-xl shadow-indigo-500/5" 
                                                : "bg-slate-950/20 border-white/5 grayscale opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className={cn(
                                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all duration-700 group-hover/mod:scale-110 group-hover/mod:rotate-3",
                                                isEnabled ? `bg-${mod.color}-500/20 text-${mod.color}-400 border-${mod.color}-500/20` : "bg-slate-800 text-slate-500 border-white/5"
                                            )}>
                                                <mod.icon size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white tracking-tight">{mod.label}</h3>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-1.5">{mod.desc}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggle(mod.key, isEnabled)}
                                            disabled={isUpdating}
                                            className={cn(
                                                "w-20 h-10 rounded-full relative transition-all duration-700 flex items-center px-1.5",
                                                isEnabled ? "bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.4)]" : "bg-slate-800",
                                                isUpdating && "animate-pulse"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-7 h-7 rounded-full bg-white transition-all duration-700 shadow-2xl flex items-center justify-center",
                                                isEnabled ? "translate-x-10" : "translate-x-0"
                                            )}>
                                                {isUpdating ? <Loader2 size={14} className="text-indigo-600 animate-spin" /> : (
                                                    isEnabled ? <Zap size={14} className="text-indigo-600" /> : <ShieldAlert size={14} className="text-slate-400" />
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Audit Legend */}
            <div className="p-12 bg-indigo-500/5 border border-indigo-500/10 rounded-[4rem] flex items-center gap-10">
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Activity size={40} className="animate-pulse" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-white tracking-tight uppercase mb-2">Protocol Enforcement Active</h4>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-4xl uppercase tracking-tighter">
                        All module state changes are audited and synchronized across the RestoLedger neural network. Provisioning latency is 
                        monitored for integrity. Non-authorized module access will be automatically blocked at the gateway level.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShopModulesPage;
